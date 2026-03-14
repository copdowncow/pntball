'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Log { id: string; event_type: string; old_value?: string; new_value?: string; description?: string; performed_by?: string; created_at: string; }
interface Booking {
  id: string; booking_number: string; customer_name: string; customer_phone: string;
  game_date: string; game_time: string; players_count: number; balls_count: number;
  total_price: number; prepayment_amount: number; price_per_100_balls: number;
  booking_status: string; prepayment_status: string; customer_comment?: string;
  admin_comment?: string; created_at: string; confirmed_at?: string;
  completed_at?: string; cancelled_at?: string; logs?: Log[];
}

const BOOKING_STATUSES = [
  { value: 'new', label: '🆕 Новая' },
  { value: 'awaiting_prepayment', label: '💰 Ожидает предоплату' },
  { value: 'prepayment_review', label: '🔍 Предоплата на проверке' },
  { value: 'confirmed', label: '✅ Подтверждена' },
  { value: 'completed', label: '🏁 Завершена' },
  { value: 'no_show', label: '🚫 Не пришёл' },
  { value: 'cancelled', label: '❌ Отменена' },
];
const PREPAYMENT_STATUSES = [
  { value: 'not_paid', label: '❌ Не внесена' },
  { value: 'pending', label: '⏳ Ожидается' },
  { value: 'confirmed', label: '✅ Подтверждена' },
  { value: 'returned', label: '↩️ Возвращена' },
  { value: 'held', label: '🔒 Удержана' },
  { value: 'cancelled', label: '🚫 Отменена' },
];

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adminComment, setAdminComment] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [newPrepayment, setNewPrepayment] = useState('');
  const [msg, setMsg] = useState('');

  const load = () => {
    setLoading(true);
    api.getBooking(id).then(data => {
      setBooking(data);
      setAdminComment(data.admin_comment || '');
      setNewStatus(data.booking_status);
      setNewPrepayment(data.prepayment_status);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const saveStatus = async () => {
    setSaving(true); setMsg('');
    try {
      await api.updateBookingStatus(id, newStatus, adminComment || undefined);
      setMsg('✅ Статус обновлён'); load();
    } catch (e: unknown) { setMsg('❌ ' + (e instanceof Error ? e.message : 'Ошибка')); }
    finally { setSaving(false); }
  };

  const savePrepayment = async () => {
    setSaving(true); setMsg('');
    try {
      await api.updatePrepayment(id, newPrepayment);
      setMsg('✅ Предоплата обновлена'); load();
    } catch (e: unknown) { setMsg('❌ ' + (e instanceof Error ? e.message : 'Ошибка')); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="p-12 text-center text-orange-500 animate-pulse">Загрузка...</div>;
  if (!booking) return <div className="p-12 text-center text-neutral-400">Бронь не найдена</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/bookings" className="text-neutral-500 hover:text-orange-400 text-sm transition-colors">← Назад</Link>
        <div>
          <h1 className="text-2xl font-black text-white">Бронь <span className="text-orange-400">{booking.booking_number}</span></h1>
          <p className="text-neutral-400 text-sm">Создано: {new Date(booking.created_at).toLocaleString('ru-RU')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Main info */}
        <div className="card p-6">
          <h2 className="text-white font-bold mb-4">Данные клиента</h2>
          <div className="space-y-3 text-sm">
            {[
              ['👤 Имя', booking.customer_name],
              ['📞 Телефон', booking.customer_phone],
              ['📅 Дата игры', `${new Date(booking.game_date).toLocaleDateString('ru-RU')} в ${booking.game_time?.substring(0,5)}`],
              ['👥 Игроков', `${booking.players_count} чел.`],
              ['🎯 Шаров', `${booking.balls_count} шт.`],
              ['💵 Цена за 100 шаров', `${booking.price_per_100_balls} сомони`],
              ['💰 Итого', `${booking.total_price} сомони`],
              ['💳 Предоплата', `${booking.prepayment_amount} сомони`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between items-start gap-4">
                <span className="text-neutral-400">{k}</span>
                <span className="text-white font-medium text-right">{v}</span>
              </div>
            ))}
            {booking.customer_comment && (
              <div className="pt-3 border-t border-neutral-800">
                <p className="text-neutral-400 text-xs mb-1">Комментарий клиента:</p>
                <p className="text-neutral-300">{booking.customer_comment}</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          {/* Status control */}
          <div className="card p-5">
            <h2 className="text-white font-bold mb-3">Статус бронирования</h2>
            <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="input-field mb-3 text-sm">
              {BOOKING_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <textarea value={adminComment} onChange={e => setAdminComment(e.target.value)}
              className="input-field text-sm resize-none mb-3" rows={2} placeholder="Комментарий администратора..." />
            <button onClick={saveStatus} disabled={saving} className="btn-primary w-full text-sm py-2">
              {saving ? 'Сохранение...' : 'Обновить статус'}
            </button>
          </div>

          {/* Prepayment control */}
          <div className="card p-5">
            <h2 className="text-white font-bold mb-3">Статус предоплаты</h2>
            <select value={newPrepayment} onChange={e => setNewPrepayment(e.target.value)} className="input-field mb-3 text-sm">
              {PREPAYMENT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <button onClick={savePrepayment} disabled={saving} className="btn-secondary w-full text-sm py-2">
              {saving ? 'Сохранение...' : 'Обновить предоплату'}
            </button>
          </div>

          {/* Quick actions */}
          <div className="card p-5">
            <h2 className="text-white font-bold mb-3">Быстрые действия</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: '✅ Подтвердить', status: 'confirmed', style: 'bg-green-600 hover:bg-green-700 text-white' },
                { label: '💰 Предоплата ✓', prepayment: 'confirmed', style: 'bg-yellow-600 hover:bg-yellow-700 text-white' },
                { label: '🏁 Завершить', status: 'completed', style: 'bg-blue-600 hover:bg-blue-700 text-white' },
                { label: '🚫 Не пришёл', status: 'no_show', style: 'bg-orange-700 hover:bg-orange-800 text-white' },
                { label: '↩️ Возврат пред.', prepayment: 'returned', style: 'bg-purple-600 hover:bg-purple-700 text-white' },
                { label: '❌ Отменить', status: 'cancelled', style: 'bg-red-700 hover:bg-red-800 text-white' },
              ].map(action => (
                <button key={action.label} disabled={saving}
                  onClick={async () => {
                    setSaving(true); setMsg('');
                    try {
                      if (action.status) await api.updateBookingStatus(id, action.status);
                      if (action.prepayment) await api.updatePrepayment(id, action.prepayment);
                      setMsg('✅ Обновлено'); load();
                    } catch { setMsg('❌ Ошибка'); }
                    finally { setSaving(false); }
                  }}
                  className={`${action.style} text-xs font-medium py-2 px-3 rounded-lg transition-colors disabled:opacity-50`}>
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          {msg && <p className="text-sm text-center font-medium" style={{ color: msg.startsWith('✅') ? '#4ade80' : '#f87171' }}>{msg}</p>}
        </div>
      </div>

      {/* Audit log */}
      {booking.logs && booking.logs.length > 0 && (
        <div className="card mt-6 overflow-hidden">
          <div className="p-4 border-b border-neutral-800">
            <h2 className="text-white font-bold">История изменений</h2>
          </div>
          <div className="divide-y divide-neutral-800">
            {booking.logs.map(log => (
              <div key={log.id} className="p-4 text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-orange-400 font-medium">{log.event_type}</span>
                  <span className="text-neutral-500 text-xs">{new Date(log.created_at).toLocaleString('ru-RU')}</span>
                </div>
                {log.description && <p className="text-neutral-300">{log.description}</p>}
                {log.old_value && log.new_value && (
                  <p className="text-neutral-500 text-xs mt-1">
                    {log.old_value} → <span className="text-neutral-300">{log.new_value}</span>
                  </p>
                )}
                {log.performed_by && <p className="text-neutral-500 text-xs mt-1">Выполнил: {log.performed_by}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
