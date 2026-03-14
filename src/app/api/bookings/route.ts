import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendNewBookingNotification } from '@/bot/telegramBot';

// GET /api/bookings?balls=300 — calculate price
export async function GET(req: NextRequest) {
  const balls = parseInt(req.nextUrl.searchParams.get('balls') || '0');
  if (!balls || balls < 100) return NextResponse.json({ error: 'Минимум 100 шаров' }, { status: 400 });
  const price100 = 70;
  const prepayment = 50;
  return NextResponse.json({
    total_price: (balls / 100) * price100,
    prepayment_amount: prepayment,
    price_per_100: price100,
  });
}

// Generate booking number without RPC
async function generateBookingNumber(): Promise<string> {
  try {
    // Try the RPC first
    const { data } = await supabase.rpc('generate_booking_number');
    if (data) return data;
  } catch {
    // RPC doesn't exist - use fallback
  }
  // Fallback: count existing bookings + timestamp
  try {
    const { count } = await supabase.from('bookings').select('id', { count: 'exact', head: true });
    const num = (count || 0) + 1;
    return `TJP-${String(num).padStart(4, '0')}`;
  } catch {
    return `TJP-${Date.now()}`;
  }
}

// POST /api/bookings — create booking
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customer_name, customer_phone, game_date, game_time,
      players_count, balls_count, customer_comment, agree_terms
    } = body;

    // Validation
    if (!customer_name?.trim()) return NextResponse.json({ error: 'Введите имя' }, { status: 400 });
    if (!customer_phone?.trim()) return NextResponse.json({ error: 'Введите номер телефона' }, { status: 400 });
    if (!game_date) return NextResponse.json({ error: 'Выберите дату' }, { status: 400 });
    if (!game_time) return NextResponse.json({ error: 'Выберите время' }, { status: 400 });
    if (!agree_terms) return NextResponse.json({ error: 'Необходимо согласие с условиями' }, { status: 400 });

    // Date validation (avoid timezone issues)
    const [year, month, day] = game_date.split('-').map(Number);
    const gameDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (gameDate < today) {
      return NextResponse.json({ error: 'Нельзя бронировать на прошедшую дату' }, { status: 400 });
    }

    const price100 = 70;
    const prepaymentAmount = 50;
    const ballsNum = parseInt(String(balls_count)) || 300;
    const playersNum = parseInt(String(players_count)) || 1;
    const totalPrice = (ballsNum / 100) * price100;

    // Format time properly for PostgreSQL TIME type
    const formattedTime = String(game_time).length === 5 ? `${game_time}:00` : String(game_time);

    const bookingNumber = await generateBookingNumber();

    const { data: booking, error: insertError } = await supabase
      .from('bookings')
      .insert({
        booking_number: bookingNumber,
        customer_name: customer_name.trim(),
        customer_phone: customer_phone.trim(),
        game_date,
        game_time: formattedTime,
        players_count: playersNum,
        balls_count: ballsNum,
        price_per_100_balls: price100,
        total_price: totalPrice,
        prepayment_amount: prepaymentAmount,
        prepayment_status: 'pending',
        booking_status: 'awaiting_prepayment',
        customer_comment: customer_comment?.trim() || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Booking insert error:', JSON.stringify(insertError));
      return NextResponse.json(
        { error: `Ошибка БД: ${insertError.message || insertError.code || 'неизвестная ошибка'}` },
        { status: 500 }
      );
    }

    // Log (non-blocking)
    supabase.from('booking_logs').insert({
      booking_id: booking.id,
      event_type: 'booking_created',
      new_value: 'awaiting_prepayment',
      description: 'Новая заявка через сайт',
      performed_by: 'client',
    }).then().catch(console.error);

    // Telegram (non-blocking)
    sendNewBookingNotification(booking).catch(console.error);

    return NextResponse.json({
      success: true,
      booking_number: booking.booking_number,
      booking_id: booking.id,
      total_price: booking.total_price,
      prepayment_amount: booking.prepayment_amount,
      status: booking.booking_status,
    }, { status: 201 });

  } catch (e) {
    console.error('Booking POST error:', e);
    const msg = e instanceof Error ? e.message : 'Неизвестная ошибка';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
