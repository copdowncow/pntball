import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAdminFromRequest } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  const { prepayment_status } = await req.json();
  const valid = ['not_paid','pending','confirmed','returned','held','cancelled'];
  if (!valid.includes(prepayment_status)) return NextResponse.json({ error: 'Неверный статус' }, { status: 400 });

  const updates: Record<string, unknown> = { prepayment_status };
  if (prepayment_status === 'confirmed') updates.prepayment_confirmed_at = new Date().toISOString();
  if (prepayment_status === 'returned') updates.prepayment_returned_at = new Date().toISOString();

  const { data } = await supabase.from('bookings').update(updates).eq('id', params.id).select().single();

  await supabase.from('booking_logs').insert({
    booking_id: params.id, event_type: 'prepayment_updated',
    new_value: prepayment_status, performed_by: admin.login,
  });

  return NextResponse.json(data);
}
