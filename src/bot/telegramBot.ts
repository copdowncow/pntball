// Telegram Bot — только отправка через fetch, БЕЗ polling и БЕЗ node-telegram-bot-api
// Получение обновлений через /api/telegram (уже существующий роут)

import { supabase } from '@/lib/supabase';

const TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID || '';
const API = `https://api.telegram.org/bot${TOKEN}`;

async function tg(method: string, body: Record<string, unknown>) {
  if (!TOKEN) return null;
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

export async function sendMessage(chatId: string | number, text: string, extra?: Record<string, unknown>) {
  return tg('sendMessage', { chat_id: chatId, text, parse_mode: 'Markdown', ...extra });
}

export async function answerCallback(id: string, text: string) {
  return tg('answerCallbackQuery', { callback_query_id: id, text });
}

export async function editMarkup(chatId: number, messageId: number) {
  return tg('editMessageReplyMarkup', {
    chat_id: chatId, message_id: messageId, reply_markup: { inline_keyboard: [] },
  });
}

const PREPAY = {
  not_paid: '❌ Не внесена', pending: '⏳ Ожидается',
  confirmed: '✅ Подтверждена', returned: '↩️ Возвращена',
  held: '🔒 Удержана', cancelled: '🚫 Отменена',
} as Record<string, string>;

const STATUS = {
  new: '🆕 Новая', awaiting_prepayment: '💰 Ожидает предоплату',
  prepayment_review: '🔍 Предоплата на проверке',
  confirmed: '✅ Подтверждена', cancelled: '❌ Отменена',
  completed: '🏁 Завершена', no_show: '🚫 Не пришёл',
} as Record<string, string>;

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
    `\n⬇️ Как только клиент оплатит — нажмите *«Предоплата получена»*`;

  await sendMessage(ADMIN_CHAT_ID, text, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '💰 Предоплата получена ✓', callback_data: `prepay_confirm_${b.id}` }],
        [{ text: '✅ Подтвердить бронь', callback_data: `confirm_${b.id}` }, { text: '❌ Отменить', callback_data: `cancel_${b.id}` }],
        [{ text: '🏁 Завершить игру', callback_data: `complete_${b.id}` }, { text: '🚫 Не пришёл', callback_data: `noshow_${b.id}` }],
        [{ text: '↩️ Вернуть предоплату', callback_data: `prepay_return_${b.id}` }],
      ],
    },
  });
}

export async function sendStatusUpdateNotification(b: Record<string, unknown>, status: string) {
  if (!TOKEN || !ADMIN_CHAT_ID) return;
  await sendMessage(ADMIN_CHAT_ID,
    `🔄 *Бронь #${b.booking_number}* — ${STATUS[status] || status}\n` +
    `${b.customer_name} · ${fmtDate(b.game_date as string)}`
  );
}

// Обработка нажатий кнопок — вызывается из /api/telegram route
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

  const actions: Record<string, { label: string; status?: string; prepayment?: string; autoConfirm?: boolean }> = {
    confirm:        { label: '✅ Бронь подтверждена',       status: 'confirmed' },
    cancel:         { label: '❌ Бронь отменена',            status: 'cancelled' },
    complete:       { label: '🏁 Игра завершена',            status: 'completed' },
    noshow:         { label: '🚫 Клиент не пришёл',          status: 'no_show' },
    // Предоплата получена → автоматически подтверждает бронь
    prepay_confirm: { label: '💰 Предоплата получена — бронь подтверждена!', prepayment: 'confirmed', autoConfirm: true },
    prepay_return:  { label: '↩️ Предоплата возвращена',    prepayment: 'returned' },
  };

  const mapped = actions[action];
  if (!mapped) return;

  try {
    // Обновить предоплату
    if (mapped.prepayment) {
      const upd: Record<string, unknown> = { prepayment_status: mapped.prepayment };
      if (mapped.prepayment === 'confirmed') upd.prepayment_confirmed_at = new Date().toISOString();
      if (mapped.prepayment === 'returned') upd.prepayment_returned_at = new Date().toISOString();
      // Если предоплата подтверждена — автоматически подтверждаем бронь
      if (mapped.autoConfirm) {
        upd.booking_status = 'confirmed';
        upd.confirmed_at = new Date().toISOString();
      }
      await supabase.from('bookings').update(upd).eq('id', bookingId);
      await supabase.from('booking_logs').insert({
        booking_id: bookingId,
        event_type: mapped.autoConfirm ? 'prepayment_confirmed_auto_booked' : 'prepayment_updated',
        new_value: mapped.prepayment,
        description: mapped.autoConfirm
          ? 'Предоплата получена — бронь автоматически подтверждена'
          : 'Статус предоплаты обновлён через Telegram',
        performed_by: 'telegram_bot',
      });
    }

    // Обновить статус брони
    if (mapped.status) {
      const upd: Record<string, unknown> = { booking_status: mapped.status };
      if (mapped.status === 'confirmed') upd.confirmed_at = new Date().toISOString();
      if (mapped.status === 'cancelled') upd.cancelled_at = new Date().toISOString();
      if (['completed', 'no_show'].includes(mapped.status)) upd.completed_at = new Date().toISOString();

      const { data: bk } = await supabase.from('bookings').update(upd).eq('id', bookingId).select().single();

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

      await supabase.from('booking_logs').insert({
        booking_id: bookingId, event_type: 'status_changed',
        new_value: mapped.status, performed_by: 'telegram_bot',
      });
    }

    await answerCallback(query.id, mapped.label);
    await editMarkup(query.message.chat.id, query.message.message_id);
    await sendMessage(query.message.chat.id, `${mapped.label}\nБронь ID: ${bookingId.substring(0, 8)}...`);
  } catch (e) {
    console.error('handleCallbackQuery error:', e);
    await answerCallback(query.id, 'Ошибка');
  }
}

// Регистрация webhook при старте сервера
export async function initTelegramBot() {
  if (!TOKEN) {
    console.warn('⚠️  TELEGRAM_BOT_TOKEN not set — bot disabled');
    return;
  }

  const domain = process.env.RAILWAY_PUBLIC_DOMAIN || process.env.APP_URL || '';
  if (!domain) {
    console.warn('⚠️  Set RAILWAY_PUBLIC_DOMAIN or APP_URL to enable Telegram webhook');
    return;
  }

  const url = `https://${domain.replace('https://', '')}/api/telegram`;
  try {
    const r = await fetch(`${API}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, drop_pending_updates: true, allowed_updates: ['message', 'callback_query'] }),
    }) as Response;
    const result = await r.json() as { ok: boolean; description?: string };
    console.log(result.ok ? `🤖 Telegram webhook: ${url}` : `⚠️  Webhook error: ${result.description}`);
  } catch (e) {
    console.error('initTelegramBot error:', e);
  }
}
