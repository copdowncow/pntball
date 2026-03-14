import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAdminFromRequest } from '@/lib/auth';
import { sendStatusUpdateNotification } from '@/bot/telegramBot';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  const { status, admin_comment } = await req.json();
  const validStatuses = ['new','awaiting_prepayment','prepayment_review','confirmed','cancelled','completed','no_show'];
  if (!validStatuses.includes(status)) return NextResponse.json({ error: 'Неверный статус' }, { status: 400 });

  const { data: existing } = await supabase.from('bookings').select('*').eq('id', params.id).single();
  if (!existing) return NextResponse.json({ error: 'Не найдено' }, { status: 404 });

  const updates: Record<string, unknown> = { booking_status: status, processed_by: admin.id };
  if (admin_comment) updates.admin_comment = admin_comment;
  if (status === 'confirmed') updates.confirmed_at = new Date().toISOString();
  if (status === 'cancelled') updates.cancelled_at = new Date().toISOString();
  if (['completed', 'no_show'].includes(status)) {
    updates.completed_at = new Date().toISOString();
    await supabase.from('games_history').insert({
      booking_id: existing.id, booking_number: existing.booking_number,
      customer_name: existing.customer_name, customer_phone: existing.customer_phone,
      game_date: existing.game_date, game_time: existing.game_time,
      players_count: existing.players_count, balls_count: existing.balls_count,
      total_price: existing.total_price, prepayment_amount: existing.prepayment_amount,
      prepayment_status: existing.prepayment_status, final_status: status,
      admin_comment: admin_comment || existing.admin_comment,
      finished_at: new Date().toISOString(),
    });
  }

  const { data: updated } = await supabase.from('bookings').update(updates).eq('id', params.id).select().single();

  await supabase.from('booking_logs').insert({
    booking_id: params.id, event_type: 'status_changed',
    old_value: existing.booking_status, new_value: status,
    description: admin_comment || `Статус изменён на "${status}"`,
    performed_by: admin.login,
  });

  sendStatusUpdateNotification(updated, status).catch(console.error);
  return NextResponse.json(updated);
}
