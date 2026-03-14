import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAdminFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  const { data: booking } = await supabase.from('bookings').select('*').eq('id', params.id).single();
  if (!booking) return NextResponse.json({ error: 'Не найдено' }, { status: 404 });

  const { data: logs } = await supabase.from('booking_logs').select('*')
    .eq('booking_id', params.id).order('created_at', { ascending: true });

  return NextResponse.json({ ...booking, logs });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  const body = await req.json();
  const allowed = ['game_date', 'game_time', 'admin_comment'].reduce((acc: Record<string, unknown>, k) => {
    if (body[k] !== undefined) acc[k] = body[k];
    return acc;
  }, {});

  const { data } = await supabase.from('bookings').update(allowed).eq('id', params.id).select().single();
  return NextResponse.json(data);
}
