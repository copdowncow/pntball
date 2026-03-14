import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAdminFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  const p = req.nextUrl.searchParams;
  const page = parseInt(p.get('page') || '1');
  const limit = Math.min(parseInt(p.get('limit') || '20'), 100);
  const offset = (page - 1) * limit;

  let query = supabase.from('games_history').select('*', { count: 'exact' })
    .order('game_date', { ascending: false }).range(offset, offset + limit - 1);

  if (p.get('date')) query = query.eq('game_date', p.get('date')!);
  if (p.get('phone')) query = query.ilike('customer_phone', `%${p.get('phone')}%`);

  const { data, count } = await query;
  return NextResponse.json({ history: data, total: count });
}
