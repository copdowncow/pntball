'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

interface Booking {
  id: string; booking_number: string; customer_name: string; customer_phone: string;
  game_date: string; game_time: string; players_count: number; balls_count: number;
  total_price: number; prepayment_amount: number; booking_status: string;
  prepayment_status: string; created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-500/20 text-blue-400', awaiting_prepayment: 'bg-yellow-500/20 text-yellow-400',
  prepayment_review: 'bg-purple-500/20 text-purple-400', confirmed: 'bg-green-500/20 text-green-400',
  cancelled: 'bg-red-500/20 text-red-400', completed: 'bg-neutral-500/20 text-neutral-400',
  no_show: 'bg-red-900/30 text-red-500',
};
const STATUS_LABELS: Record<string, string> = {
  new: 'Новая', awaiting_prepayment: 'Ждёт предоплату', prepayment_review: 'Предоплата ✓',
  confirmed: 'Подтверждена', cancelled: 'Отменена', completed: 'Завершена', no_show: 'Не пришёл',
};

export default function AdminBookingsPage() {
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    date: '', phone: '', name: '', search: '',
  });

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (filters.status) params.status = filters.status;
      if (filters.date) params.date = filters.date;
      if (filters.phone) params.phone = filters.phone;
      if (filters.name) params.name = filters.name;
      if (filters.search) params.search = filters.search;
      const data = await api.getBookings(params);
      setBookings(data.bookings || []);
      setTotal(data.total || 0);
    } finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Бронирования</h1>
          <p className="text-neutral-400 text-sm mt-1">Всего: {total}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6 grid grid-cols-2 md:grid-cols-5 gap-3">
        <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
          className="input-field text-sm">
          <option value="">Все статусы</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <input type="date" value={filters.date} onChange={e => setFilters(f => ({ ...f, date: e.target.value }))}
          className="input-field text-sm" placeholder="Дата" />
        <input type="text" value={filters.phone} onChange={e => setFilters(f => ({ ...f, phone: e.target.value }))}
          className="input-field text-sm" placeholder="Телефон" />
        <input type="text" value={filters.name} onChange={e => setFilters(f => ({ ...f, name: e.target.value }))}
          className="input-field text-sm" placeholder="Имя" />
        <input type="text" value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          className="input-field text-sm" placeholder="№ брони (TJP-...)" />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-orange-500 animate-pulse">Загрузка...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-800 text-neutral-500 text-xs">
                  {['№ Брони', 'Клиент', 'Дата / Время', 'Игроки', 'Шары', 'Сумма', 'Предоплата', 'Статус', ''].map(h => (
                    <th key={h} className="text-left p-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id} className="border-b border-neutral-800/50 hover:bg-neutral-800/20 transition-colors">
                    <td className="p-3">
                      <Link href={`/admin/bookings/${b.id}`} className="text-orange-400 hover:text-orange-300 font-mono text-sm font-bold">
                        {b.booking_number}
                      </Link>
                    </td>
                    <td className="p-3">
                      <div className="text-white text-sm font-medium">{b.customer_name}</div>
                      <div className="text-neutral-500 text-xs">{b.customer_phone}</div>
                    </td>
                    <td className="p-3 text-neutral-300 text-sm">
                      <div>{new Date(b.game_date).toLocaleDateString('ru-RU')}</div>
                      <div className="text-neutral-500 text-xs">{b.game_time?.substring(0, 5)}</div>
                    </td>
                    <td className="p-3 text-neutral-300 text-sm">{b.players_count}</td>
                    <td className="p-3 text-neutral-300 text-sm">{b.balls_count}</td>
                    <td className="p-3 text-white text-sm font-medium">{b.total_price} сом.</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${b.prepayment_status === 'confirmed' ? 'bg-green-500/20 text-green-400' : b.prepayment_status === 'returned' ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {b.prepayment_status === 'confirmed' ? '✅ Внесена' : b.prepayment_status === 'returned' ? '↩️ Возвращена' : b.prepayment_status === 'pending' ? '⏳ Ожидается' : '❌ Нет'}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[b.booking_status] || 'bg-neutral-700 text-neutral-300'}`}>
                        {STATUS_LABELS[b.booking_status] || b.booking_status}
                      </span>
                    </td>
                    <td className="p-3">
                      <Link href={`/admin/bookings/${b.id}`} className="text-orange-400 hover:text-orange-300 text-xs">
                        Открыть →
                      </Link>
                    </td>
                  </tr>
                ))}
                {bookings.length === 0 && (
                  <tr><td colSpan={9} className="p-12 text-center text-neutral-500">Бронирования не найдены</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {/* Pagination */}
        {total > 20 && (
          <div className="p-4 border-t border-neutral-800 flex items-center justify-between">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="btn-secondary py-2 px-4 text-sm disabled:opacity-40">← Назад</button>
            <span className="text-neutral-400 text-sm">Страница {page} из {Math.ceil(total / 20)}</span>
            <button disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)}
              className="btn-secondary py-2 px-4 text-sm disabled:opacity-40">Далее →</button>
          </div>
        )}
      </div>
    </div>
  );
}
