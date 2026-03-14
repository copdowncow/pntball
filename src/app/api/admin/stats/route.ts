import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAdminFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  const today = new Date().toISOString().split('T')[0];
  const [total, todayRes, confirmed, completed] = await Promise.all([
    supabase.from('bookings').select('id', { count: 'exact', head: true }),
    supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('game_date', today),
    supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('booking_status', 'confirmed'),
    supabase.from('games_history').select('id', { count: 'exact', head: true }),
  ]);

  const { data: revenueData } = await supabase.from('games_history').select('total_price').eq('final_status', 'completed');
  const totalRevenue = revenueData?.reduce((s, r) => s + Number(r.total_price), 0) || 0;

  return NextResponse.json({
    total_bookings: total.count || 0,
    today_bookings: todayRes.count || 0,
    confirmed_bookings: confirmed.count || 0,
    total_games: completed.count || 0,
    total_revenue: totalRevenue,
  });
}
