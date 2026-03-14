'use client';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';

interface GameHistory {
  id: string; booking_number: string; customer_name: string; customer_phone: string;
  game_date: string; game_time: string; players_count: number; balls_count: number;
  total_price: number; prepayment_amount: number; prepayment_status: string;
  final_status: string; finished_at: string;
}

const FINAL_STATUS: Record<string, { label: string; color: string }> = {
  completed: { label: '🏁 Завершена', color: 'bg-green-500/20 text-green-400' },
  no_show: { label: '🚫 Не пришёл', color: 'bg-red-900/30 text-red-400' },
  cancelled: { label: '❌ Отменена', color: 'bg-neutral-700 text-neutral-400' },
};

export default function AdminHistoryPage() {
  const [history, setHistory] = useState<GameHistory[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ date: '', phone: '' });

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (filters.date) params.date = filters.date;
      if (filters.phone) params.phone = filters.phone;
      const data = await api.getHistory(params);
      setHistory(data.history || []);
      setTotal(data.total || 0);
    } finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const totalRevenue = history.filter(h => h.final_status === 'completed').reduce((s, h) => s + Number(h.total_price), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">История игр</h1>
        <p className="text-neutral-400 text-sm mt-1">Всего записей: {total} · Выручка на странице: {totalRevenue} сомони</p>
      </div>

      <div className="card p-4 mb-6 grid grid-cols-2 gap-3 max-w-sm">
        <input type="date" value={filters.date} onChange={e => setFilters(f => ({ ...f, date: e.target.value }))}
          className="input-field text-sm" />
        <input type="text" value={filters.phone} onChange={e => setFilters(f => ({ ...f, phone: e.target.value }))}
          className="input-field text-sm" placeholder="Телефон" />
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-orange-500 animate-pulse">Загрузка...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-800 text-neutral-500 text-xs">
                  {['№ Брони', 'Клиент', 'Дата игры', 'Игроки', 'Шары', 'Сумма', 'Предоплата', 'Итог', 'Завершена'].map(h => (
                    <th key={h} className="text-left p-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map(h => (
                  <tr key={h.id} className="border-b border-neutral-800/50 hover:bg-neutral-800/20">
                    <td className="p-3 font-mono text-orange-400 text-sm">{h.booking_number}</td>
                    <td className="p-3">
                      <div className="text-white text-sm">{h.customer_name}</div>
                      <div className="text-neutral-500 text-xs">{h.customer_phone}</div>
                    </td>
                    <td className="p-3 text-neutral-300 text-sm">{new Date(h.game_date).toLocaleDateString('ru-RU')}</td>
                    <td className="p-3 text-neutral-300 text-sm">{h.players_count}</td>
                    <td className="p-3 text-neutral-300 text-sm">{h.balls_count}</td>
                    <td className="p-3 text-white font-medium text-sm">{h.total_price} сом.</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${h.prepayment_status === 'returned' ? 'bg-blue-500/20 text-blue-400' : h.prepayment_status === 'confirmed' ? 'bg-green-500/20 text-green-400' : 'bg-neutral-700 text-neutral-400'}`}>
                        {h.prepayment_status === 'returned' ? '↩️ Возвр.' : h.prepayment_status === 'confirmed' ? '✅ Внес.' : '—'}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${(FINAL_STATUS[h.final_status] || { color: 'bg-neutral-700 text-neutral-400' }).color}`}>
                        {(FINAL_STATUS[h.final_status] || { label: h.final_status }).label}
                      </span>
                    </td>
                    <td className="p-3 text-neutral-500 text-xs">{h.finished_at ? new Date(h.finished_at).toLocaleDateString('ru-RU') : '—'}</td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr><td colSpan={9} className="p-12 text-center text-neutral-500">История игр пуста</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {total > 20 && (
          <div className="p-4 border-t border-neutral-800 flex items-center justify-between">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary py-2 px-4 text-sm disabled:opacity-40">← Назад</button>
            <span className="text-neutral-400 text-sm">Страница {page} из {Math.ceil(total / 20)}</span>
            <button disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)} className="btn-secondary py-2 px-4 text-sm disabled:opacity-40">Далее →</button>
          </div>
        )}
      </div>
    </div>
  );
}
