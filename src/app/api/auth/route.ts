import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/supabase';
import { signToken, getAdminFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { login, password } = await req.json();
    if (!login || !password) return NextResponse.json({ error: 'Заполните все поля' }, { status: 400 });

    const { data: admin } = await supabase.from('admins').select('*').eq('login', login).single();
    if (!admin) return NextResponse.json({ error: 'Неверный логин или пароль' }, { status: 401 });

    const ok = await bcrypt.compare(password, admin.password_hash);
    if (!ok) return NextResponse.json({ error: 'Неверный логин или пароль' }, { status: 401 });

    const token = signToken({ id: admin.id, login: admin.login, role: admin.role });
    return NextResponse.json({ token, admin: { id: admin.id, login: admin.login, role: admin.role } });
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  return NextResponse.json({ admin });
}
