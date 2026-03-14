import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date');
  const { data: allSlots } = await supabase.from('time_slots').select('*').eq('is_active', true).order('sort_order');
  if (!date) return NextResponse.json(allSlots || []);

  const { data: booked } = await supabase.from('bookings').select('game_time')
    .eq('game_date', date).not('booking_status', 'in', '("cancelled")');

  const bookedTimes = new Set(booked?.map(b => b.game_time.substring(0, 5)));
  return NextResponse.json((allSlots || []).map(slot => ({
    ...slot, is_available: !bookedTimes.has(slot.slot_time.substring(0, 5)),
  })));
}
