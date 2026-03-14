import TelegramBot from 'node-telegram-bot-api';
import { supabase } from '@/lib/supabase';

let bot: TelegramBot | null = null;

const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID || '';

const STATUS_LABELS: Record<string, string> = {
  new: '🆕 Новая',
  awaiting_prepayment: '💰 Ожидает предоплату',
  confirmed: '✅ Подтверждена',
  cancelled: '❌ Отменена',
  completed: '🏁 Завершена',
  no_show: '🚫 Не пришёл',
};

const PREPAYMENT_LABELS: Record<string, string> = {
  not_paid: '❌ Не внесена',
  pending: '⏳ Ожидается',
  confirmed: '✅ Подтверждена',
  returned: '↩️ Возвращена',
  held: '🔒 Удержана',
  cancelled: '🚫 Отменена',
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ru-RU');
}

function buildMessage(b: Record<string, unknown>) {
  return (
    `🎯 *Новая бронь — Taj Paintball*\n\n` +
    `📋 ID: #${b.booking_number}\n` +
    `👤 ${b.customer_name}\n` +
    `📞 ${b.customer_phone}\n` +
    `📅 ${formatDate(b.game_date as string)} в ${String(b.game_time).substring(0, 5)}\n` +
    `👥 Игроков: ${b.players_count}  🎯 Шаров: ${b.balls_count}\n` +
    `💵 Сумма: ${b.total_price} сомони\n` +
    `💰 Предоплата: ${b.prepayment_amount} сомони\n` +
    `📊 ${PREPAYMENT_LABELS[b.prepayment_status as string] || b.prepayment_status}\n` +
    (b.customer_comment ? `💬 ${b.customer_comment}\n` : '') +
    `🕒 ${new Date(b.created_at as string).toLocaleString('ru-RU')}`
  );
}

function keyboard(id: string) {
  return {
    inline_keyboard: [
      [
        { text: '✅ Подтвердить', callback_data: `confirm_${id}` },
        { text: '❌ Отменить', callback_data: `cancel_${id}` },
      ],
      [
        { text: '💰 Предоплата ✓', callback_data: `prepay_confirm_${id}` },
        { text: '↩️ Возврат пред.', callback_data: `prepay_return_${id}` },
      ],
      [
        { text: '🏁 Завершить', callback_data: `complete_${id}` },
        { text: '🚫 Не пришёл', callback_data: `noshow_${id}` },
      ],
    ],
  };
}

export async function sendNewBookingNotification(b: Record<string, unknown>) {
  if (!bot || !ADMIN_CHAT_ID) return;
  try {
    await bot.sendMessage(ADMIN_CHAT_ID, buildMessage(b), {
      parse_mode: 'Markdown',
      reply_markup: keyboard(b.id as string),
    });
  } catch (e) {
    console.error('Telegram send error:', e);
  }
}

export async function sendStatusUpdateNotification(b: Record<string, unknown>, status: string) {
  if (!bot || !ADMIN_CHAT_ID) return;
  try {
    await bot.sendMessage(
      ADMIN_CHAT_ID,
      `🔄 *Бронь #${b.booking_number}* — ${STATUS_LABELS[status] || status}\n` +
      `${b.customer_name} · ${formatDate(b.game_date as string)}`,
      { parse_mode: 'Markdown' }
    );
  } catch (e) {
    console.error('Telegram update error:', e);
  }
}

async function handleCallback(query: TelegramBot.CallbackQuery) {
  if (!bot || !query.data || !query.message) return;

  const data = query.data;
  let action = '';
  let bookingId = '';

  if (data.startsWith('prepay_confirm_')) {
    action = 'prepay_confirm';
    bookingId = data.replace('prepay_confirm_', '');
  } else if (data.startsWith('prepay_return_')) {
    action = 'prepay_return';
    bookingId = data.replace('prepay_return_', '');
  } else {
    const idx = data.indexOf('_');
    action = data.substring(0, idx);
    bookingId = data.substring(idx + 1);
  }

  const actions: Record<string, { label: string; status?: string; prepayment?: string }> = {
    confirm:        { label: '✅ Подтверждено',          status: 'confirmed' },
    cancel:         { label: '❌ Отменено',               status: 'cancelled' },
    complete:       { label: '🏁 Игра завершена',         status: 'completed' },
    noshow:         { label: '🚫 Клиент не пришёл',       status: 'no_show' },
    prepay_confirm: { label: '💰 Предоплата получена',    prepayment: 'confirmed' },
    prepay_return:  { label: '↩️ Предоплата возвращена',  prepayment: 'returned' },
  };

  const mapped = actions[action];
  if (!mapped) return;

  try {
    if (mapped.status) {
      const updates: Record<string, unknown> = { booking_status: mapped.status };
      if (mapped.status === 'confirmed') updates.confirmed_at = new Date().toISOString();
      if (mapped.status === 'cancelled') updates.cancelled_at = new Date().toISOString();
      if (['completed', 'no_show'].includes(mapped.status)) {
        updates.completed_at = new Date().toISOString();
      }

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
      const updates: Record<string, unknown> = { prepayment_status: mapped.prepayment };
      if (mapped.prepayment === 'confirmed') updates.prepayment_confirmed_at = new Date().toISOString();
      if (mapped.prepayment === 'returned') updates.prepayment_returned_at = new Date().toISOString();
      await supabase.from('bookings').update(updates).eq('id', bookingId);
    }

    await bot.answerCallbackQuery(query.id, { text: mapped.label });
    await bot.editMessageReplyMarkup(
      { inline_keyboard: [] },
      { chat_id: query.message.chat.id, message_id: query.message.message_id }
    );
    await bot.sendMessage(query.message.chat.id, mapped.label);
  } catch (e) {
    console.error('Callback error:', e);
    try { await bot.answerCallbackQuery(query.id, { text: 'Ошибка' }); } catch {}
  }
}

export async function initTelegramBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn('⚠️  TELEGRAM_BOT_TOKEN not set — bot disabled');
    return;
  }

  try {
    // Сначала удаляем вебхук и сбрасываем очередь — это закрывает все старые polling сессии
    const cleanupBot = new TelegramBot(token, { polling: false });
    await cleanupBot.deleteWebHook();
    console.log('🤖 Webhook cleared, starting polling...');

    // Небольшая пауза чтобы Telegram успел закрыть старые сессии
    await new Promise(r => setTimeout(r, 2000));

    bot = new TelegramBot(token, {
      polling: {
        interval: 1000,
        autoStart: true,
        params: { timeout: 10 },
      },
    });

    bot.on('message', async (msg) => {
      if (!bot) return;
      if (msg.text === '/start') {
        await bot.sendMessage(
          msg.chat.id,
          `🎯 *Taj Paintball Bot*\n\nChat ID: \`${msg.chat.id}\`\nБот активен ✅`,
          { parse_mode: 'Markdown' }
        );
      }
      if (msg.text === '/stats') {
        const { count: total } = await supabase.from('bookings').select('id', { count: 'exact', head: true });
        const today = new Date().toISOString().split('T')[0];
        const { count: todayCount } = await supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('game_date', today);
        await bot.sendMessage(
          msg.chat.id,
          `📊 *Статистика*\nВсего броней: ${total}\nСегодня: ${todayCount}`,
          { parse_mode: 'Markdown' }
        );
      }
    });

    bot.on('callback_query', handleCallback);

    bot.on('polling_error', (err: Error & { code?: string }) => {
      // Игнорируем 409 — это нормально при рестарте
      if (err.code === 'ETELEGRAM' && err.message?.includes('409')) {
        console.warn('⚠️  Telegram 409 — waiting for old session to close...');
        return;
      }
      console.error('Telegram polling error:', err.message);
    });

    console.log('🤖 Telegram Bot started successfully');
  } catch (e) {
    console.error('Bot init error:', e);
  }
}
