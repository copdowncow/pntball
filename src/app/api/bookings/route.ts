import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendNewBookingNotification } from '@/bot/telegramBot';

// GET /api/bookings?balls=300 — calculate price
export async function GET(req: NextRequest) {
  const balls = parseInt(req.nextUrl.searchParams.get('balls') || '0');
  if (!balls || balls < 100) return NextResponse.json({ error: 'Минимум 100 шаров' }, { status: 400 });

  const { data: settings } = await supabase.from('settings').select('key,value')
    .in('key', ['price_per_100_balls', 'prepayment_amount']);

  const price100 = parseFloat(settings?.find(s => s.key === 'price_per_100_balls')?.value || '70');
  const prepayment = parseFloat(settings?.find(s => s.key === 'prepayment_amount')?.value || '50');
  return NextResponse.json({ total_price: (balls / 100) * price100, prepayment_amount: prepayment, price_per_100: price100 });
}

// POST /api/bookings — create booking
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customer_name, customer_phone, game_date, game_time, players_count, balls_count, customer_comment, agree_terms } = body;

    if (!customer_name?.trim()) return NextResponse.json({ error: 'Введите имя' }, { status: 400 });
    if (!customer_phone?.trim()) return NextResponse.json({ error: 'Введите телефон' }, { status: 400 });
    if (!game_date) return NextResponse.json({ error: 'Выберите дату' }, { status: 400 });
    if (!game_time) return NextResponse.json({ error: 'Выберите время' }, { status: 400 });
    if (!agree_terms) return NextResponse.json({ error: 'Необходимо согласие с условиями' }, { status: 400 });

    const gameDate = new Date(game_date);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (gameDate < today) return NextResponse.json({ error: 'Нельзя бронировать в прошлом' }, { status: 400 });

    const { data: settings } = await supabase.from('settings').select('key,value')
      .in('key', ['price_per_100_balls', 'prepayment_amount']);
    const price100 = parseFloat(settings?.find(s => s.key === 'price_per_100_balls')?.value || '70');
    const prepayment = parseFloat(settings?.find(s => s.key === 'prepayment_amount')?.value || '50');
    const totalPrice = (balls_count / 100) * price100;

    const { data: numData } = await supabase.rpc('generate_booking_number');
    const bookingNumber = numData || `TJP-${Date.now()}`;

    const { data: booking, error } = await supabase.from('bookings').insert({
      booking_number: bookingNumber,
      customer_name: customer_name.trim(),
      customer_phone: customer_phone.trim(),
      game_date, game_time,
      players_count: parseInt(players_count),
      balls_count: parseInt(balls_count),
      price_per_100_balls: price100,
      total_price: totalPrice,
      prepayment_amount: prepayment,
      prepayment_status: 'pending',
      booking_status: 'awaiting_prepayment',
      customer_comment: customer_comment || null,
    }).select().single();

    if (error) { console.error(error); return NextResponse.json({ error: 'Ошибка создания брони' }, { status: 500 }); }

    await supabase.from('booking_logs').insert({
      booking_id: booking.id, event_type: 'booking_created',
      new_value: 'awaiting_prepayment', description: 'Новая заявка через сайт', performed_by: 'client',
    });

    sendNewBookingNotification(booking).catch(console.error);

    return NextResponse.json({
      success: true, booking_number: booking.booking_number,
      booking_id: booking.id, total_price: booking.total_price,
      prepayment_amount: booking.prepayment_amount, status: booking.booking_status,
    }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
