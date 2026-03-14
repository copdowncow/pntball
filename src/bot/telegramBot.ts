
Telegram Bot — только отправка сообщений (без polling)
// Получение команд через webhook: /api/telegram/webhook

import { supabase } from '@/lib/supabase';

const TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID || '';
const API = `https://api.telegram.org/bot${TOKEN}`;

async function tgRequest(method: string, body: Record<string, unknown>) {
  if (!TOKEN) return;
  try {
    await fetch(`${API}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (e) {
    console.error(`Telegram ${method} error:`, e);
  }
}

const PREPAYMENT_LABELS: Record<string, string> = {
  not_paid: '❌ Не внесена', pending: '⏳ Ожидается',
  confirmed: '✅ Подтверждена', returned: '↩️ Возвращена',
  held: '🔒 Удержана', cancelled: '🚫 Отменена',
};

const STATUS_LABELS: Record<string, string> = {
  new: '🆕 Новая', awaiting_prepayment: '💰 Ожидает предоплату',
  confirmed: '✅ Подтверждена', cancelled: '❌ Отменена',
  completed: '🏁 Завершена', no_show: '🚫 Не пришёл',
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ru-RU');
}

export async function sendNewBookingNotification(b: Record<string, unknown>) {
  if (!TOKEN || !ADMIN_CHAT_ID) return;

  const text =
    `🎯 *Новая бронь — Taj Paintball*\n\n` +
    `📋 ID: #${b.booking_number}\n` +
    `👤 ${b.customer_name}\n` +
    `📞 ${b.customer_phone}\n` +
    `📅 ${formatDate(b.game_date as string)} в ${String(b.game_time).substring(0, 5)}\n` +
    `👥 Игроков: ${b.players_count}  🎯 Шаров: ${b.balls_count}\n` +
    `💵 Сумма: ${b.total_price} сомони\n` +
    `💰 Предоплата: ${b.prepayment_amount} сомони\n` +
    `📊 ${PREPAYMENT_LABELS[b.prepayment_status as string] || ''}\n` +
    (b.customer_comment ? `💬 ${b.customer_comment}\n` : '');

  await tgRequest('sendMessage', {
    chat_id: ADMIN_CHAT_ID,
    text,
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '✅ Подтвердить', callback_data: `confirm_${b.id}` }, { text: '❌ Отменить', callback_data: `cancel_${b.id}` }],
        [{ text: '💰 Предоплата ✓', callback_data: `prepay_confirm_${b.id}` }, { text: '↩️ Возврат', callback_data: `prepay_return_${b.id}` }],
        [{ text: '🏁 Завершить', callback_data: `complete_${b.id}` }, { text: '🚫 Не пришёл', callback_data: `noshow_${b.id}` }],
      ],
    },
  });
}

export async function sendStatusUpdateNotification(b: Record<string, unknown>, status: string) {
  if (!TOKEN || !ADMIN_CHAT_ID) return;
  await tgRequest('sendMessage', {
    chat_id: ADMIN_CHAT_ID,
    text: `🔄 *Бронь #${b.booking_number}* — ${STATUS_LABELS[status] || status}\n${b.customer_name} · ${formatDate(b.game_date as string)}`,
    parse_mode: 'Markdown',
  });
}

export async function answerCallback(callbackQueryId: string, text: string) {
  await tgRequest('answerCallbackQuery', { callback_query_id: callbackQueryId, text });
}

export async function editMessageReplyMarkup(chatId: number, messageId: number) {
  await tgRequest('editMessageReplyMarkup', {
    chat_id: chatId, message_id: messageId, reply_markup: { inline_keyboard: [] },
  });
}

export async function sendMessage(chatId: number | string, text: string) {
  await tgRequest('sendMessage', { chat_id: chatId, text, parse_mode: 'Markdown' });
}

// Обработка callback кнопок (вызывается из webhook роута)
export async function handleCallbackQuery(query: {
  id: string;
  data?: string;
  message?: { chat: { id: number }; message_id: number };
}) {
  if (!query.data || !query.message) return;

  const data = query.data;
  let action = '';
  let bookingId = '';

  if (data.startsWith('prepay_confirm_')) {
    action = 'prepay_confirm'; bookingId = data.replace('prepay_confirm_', '');
  } else if (data.startsWith('prepay_return_')) {
    action = 'prepay_return'; bookingId = data.replace('prepay_return_', '');
  } else {
    const idx = data.indexOf('_');
    action = data.substring(0, idx);
    bookingId = data.substring(idx + 1);
  }

  const actions: Record<string, { label: string; status?: string; prepayment?: string }> = {
    confirm:        { label: '✅ Подтверждено',       status: 'confirmed' },
    cancel:         { label: '❌ Отменено',            status: 'cancelled' },
    complete:       { label: '🏁 Игра завершена',      status: 'completed' },
    noshow:         { label: '🚫 Клиент не пришёл',    status: 'no_show' },
    prepay_confirm: { label: '💰 Предоплата получена', prepayment: 'confirmed' },
    prepay_return:  { label: '↩️ Предоплата возвращена', prepayment: 'returned' },
  };

  const mapped = actions[action];
  if (!mapped) return;

  try {
    if (mapped.status) {
      const updates: Record<string, unknown> = { booking_status: mapped.status };
      if (mapped.status === 'confirmed') updates.confirmed_at = new Date().toISOString();
      if (mapped.status === 'cancelled') updates.cancelled_at = new Date().toISOString();
      if (['completed', 'no_show'].includes(mapped.status)) updates.completed_at = new Date().toISOString();

      const { data: bk } = await supabase.from('bookings').update(updates).eq('id', bookingId).select().single();

      if (bk && ['completed', 'no_show'].includes(mapped.status)) {
        await supabase.from('games_history').insert({
          booking_id: bk.id, booking_number: bk.booking_number,
          customer_name: bk.customer_name, customer_phone: bk.customer_phone,
          game_date: bk.game_date, game_time: bk.game_time,
          players_count: bk.players_count, balls_count: bk.balls_count,
          total_price: bk.total_price, prepayment_amount: bk.prepayment_amount,
          prepayment_status: bk.prepayment_status, final_status: mapped.status,
          finished_at: new Date().toISOString(),
        });
      }
    }

    if (mapped.prepayment) {
      const upd: Record<string, unknown> = { prepayment_status: mapped.prepayment };
      if (mapped.prepayment === 'confirmed') upd.prepayment_confirmed_at = new Date().toISOString();
      if (mapped.prepayment === 'returned') upd.prepayment_returned_at = new Date().toISOString();
      await supabase.from('bookings').update(upd).eq('id', bookingId);
    }

    await answerCallback(query.id, mapped.label);
    await editMessageReplyMarkup(query.message.chat.id, query.message.message_id);
    await sendMessage(query.message.chat.id, mapped.label);
  } catch (e) {
    console.error('handleCallbackQuery error:', e);
    await answerCallback(query.id, 'Ошибка');
  }
}

// Инициализация — только регистрирует webhook, никакого polling
export async function initTelegramBot() {
  if (!TOKEN) {
    console.warn('⚠️  TELEGRAM_BOT_TOKEN not set');
    return;
  }

  const appUrl = process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : process.env.APP_URL || '';

  if (!appUrl) {
    console.warn('⚠️  APP_URL not set — Telegram webhook not registered');
    return;
  }

  const webhookUrl = `${appUrl}/api/telegram/webhook`;

  try {
    const res = await fetch(`${API}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message', 'callback_query'],
        drop_pending_updates: true,
      }),
    });
    const result = await res.json() as { ok: boolean; description?: string };
    if (result.ok) {
      console.log(`🤖 Telegram webhook set: ${webhookUrl}`);
    } else {
      console.error('Webhook set failed:', result.description);
    }
  } catch (e) {
    console.error('initTelegramBot error:', e);
  }
}
