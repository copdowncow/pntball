// Telegram Bot — только отправка сообщений через fetch
// Никакого polling, никаких новых файлов

import { supabase } from '@/lib/supabase';

const TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID || '';
const API = `https://api.telegram.org/bot${TOKEN}`;

async function tg(method: string, body: Record<string, unknown>) {
  if (!TOKEN || !ADMIN_CHAT_ID) return null;
  try {
    const res = await fetch(`${API}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.json();
  } catch (e) {
    console.error(`Telegram ${method} error:`, e);
    return null;
  }
}

const PREPAY: Record<string, string> = {
  not_paid: '❌ Не внесена', pending: '⏳ Ожидается',
  confirmed: '✅ Подтверждена', returned: '↩️ Возвращена',
  held: '🔒 Удержана', cancelled: '🚫 Отменена',
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('ru-RU');
}

export async function sendNewBookingNotification(b: Record<string, unknown>) {
  if (!TOKEN || !ADMIN_CHAT_ID) return;

  const text =
    `🎯 *Новая бронь — Taj Paintball*\n\n` +
    `📋 ID: #${b.booking_number}\n` +
    `👤 ${b.customer_name}\n` +
    `📞 ${b.customer_phone}\n` +
    `📅 ${fmtDate(b.game_date as string)} в ${String(b.game_time).substring(0, 5)}\n` +
    `👥 Игроков: ${b.players_count}  🎯 Шаров: ${b.balls_count}\n` +
    `💵 Сумма: ${b.total_price} сомони\n` +
    `💰 Предоплата: ${b.prepayment_amount} сомони\n` +
    `📊 ${PREPAY[b.prepayment_status as string] || ''}\n` +
    (b.customer_comment ? `💬 ${b.customer_comment}\n` : '') +
    `\n⚡️ Войдите в админ-панель для подтверждения`;

  await tg('sendMessage', {
    chat_id: ADMIN_CHAT_ID,
    text,
    parse_mode: 'Markdown',
  });
}

export async function sendStatusUpdateNotification(b: Record<string, unknown>, status: string) {
  if (!TOKEN || !ADMIN_CHAT_ID) return;
  const labels: Record<string, string> = {
    confirmed: '✅ Подтверждена', cancelled: '❌ Отменена',
    completed: '🏁 Завершена', no_show: '🚫 Не пришёл',
    prepayment_review: '🔍 Предоплата на проверке',
  };
  await tg('sendMessage', {
    chat_id: ADMIN_CHAT_ID,
    text: `🔄 *Бронь #${b.booking_number}* — ${labels[status] || status}\n${b.customer_name} · ${fmtDate(b.game_date as string)}`,
    parse_mode: 'Markdown',
  });
}

// Заглушка — polling не используется
export async function initTelegramBot() {
  if (!TOKEN) {
    console.warn('⚠️  TELEGRAM_BOT_TOKEN not set');
    return;
  }
  console.log('🤖 Telegram Bot ready (send-only mode)');
}
