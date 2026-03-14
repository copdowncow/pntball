import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAdminFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const isAll = req.nextUrl.searchParams.get('all');
  const isSettings = req.nextUrl.searchParams.get('settings');

  if (isSettings) {
    const { data } = await supabase.from('settings').select('*');
    return NextResponse.json(data || []);
  }
  if (isAll) {
    const admin = getAdminFromRequest(req);
    if (!admin) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    const { data } = await supabase.from('pricing').select('*').order('sort_order');
    return NextResponse.json(data || []);
  }
  const { data } = await supabase.from('pricing').select('*').eq('is_active', true).order('sort_order');
  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  const body = await req.json();
  const { data } = await supabase.from('pricing').insert(body).select().single();
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  const id = req.nextUrl.searchParams.get('id');
  const isSettings = req.nextUrl.searchParams.get('settings');
  const key = req.nextUrl.searchParams.get('key');
  const body = await req.json();

  if (isSettings && key) {
    const { data } = await supabase.from('settings').update({ value: body.value, updated_at: new Date().toISOString() }).eq('key', key).select().single();
    return NextResponse.json(data);
  }
  if (id) {
    const { data } = await supabase.from('pricing').update(body).eq('id', id).select().single();
    return NextResponse.json(data);
  }
  return NextResponse.json({ error: 'Нет id' }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Нет id' }, { status: 400 });
  await supabase.from('pricing').delete().eq('id', id);
  return NextResponse.json({ success: true });
}
