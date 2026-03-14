import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Fallback slots если таблица time_slots пустая
const DEFAULT_SLOTS = [
  '10:00','11:00','12:00','13:00','14:00',
  '15:00','16:00','17:00','18:00','19:00','20:00'
];

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date');

  let allSlots: { id: string; slot_time: string; is_active: boolean; sort_order: number }[] = [];

  try {
    const { data } = await supabase
      .from('time_slots')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    allSlots = data || [];
  } catch {
    allSlots = [];
  }

  // Если таблица пустая — используем дефолтные слоты
  if (allSlots.length === 0) {
    allSlots = DEFAULT_SLOTS.map((t, i) => ({
      id: `default-${i}`,
      slot_time: t,
      is_active: true,
      sort_order: i,
    }));
  }

  if (!date) {
    return NextResponse.json(allSlots.map(s => ({ ...s, is_available: true })));
  }

  // Получить забронированные слоты на эту дату
  let bookedTimes = new Set<string>();
  try {
    const { data: booked } = await supabase
      .from('bookings')
      .select('game_time')
      .eq('game_date', date)
      .not('booking_status', 'eq', 'cancelled');

    bookedTimes = new Set(booked?.map(b => String(b.game_time).substring(0, 5)) || []);
  } catch {
    bookedTimes = new Set();
  }

  return NextResponse.json(
    allSlots.map(slot => ({
      ...slot,
      is_available: !bookedTimes.has(String(slot.slot_time).substring(0, 5)),
    }))
  );
}
