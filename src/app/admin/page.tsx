'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Stats {
  total_bookings: number;
  today_bookings: number;
  confirmed_bookings: number;
  total_games: number;
  total_revenue: number;
}

interface Booking {
  id: string;
  booking_number: string;
  customer_name: string;
  customer_phone: string;
  game_date: string;
  game_time: string;
  players_count: number;
  balls_count: number;
  total_price: number;
  booking_status: string;
  prepayment_status: string;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-500/20 text-blue-400',
  awaiting_prepayment: 'bg-yellow-500/20 text-yellow-400',
  prepayment_review: 'bg-purple-500/20 text-purple-400',
  confirmed: 'bg-green-500/20 text-green-400',
  cancelled: 'bg-red-500/20 text-red-400',
  completed: 'bg-neutral-500/20 text-neutral-400',
  no_show: 'bg-red-900/30 text-red-500',
};

const STATUS_LABELS: Record<string, string> = {
  new: 'Новая',
  awaiting_prepayment: 'Ожид. предоплату',
  prepayment_review: 'Предоплата на проверке',
  confirmed: 'Подтверждена',
  cancelled: 'Отменена',
  completed: 'Завершена',
  no_show: 'Не пришёл',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<Booking[]>([]);

  useEffect(() => {
    api.getStats().then(setStats).catch(console.error);
    api.getBookings({ limit: '5', page: '1' }).then(d => setRecent(d.bookings || [])).catch(console.error);
  }, []);

  const statCards = stats ? [
    { label: 'Всего броней', value: stats.total_bookings, icon: '📋', color: 'text-blue-400' },
    { label: 'Сегодня', value: stats.today_bookings, icon: '📅', color: 'text-orange-400' },
    { label: 'Подтверждено', value: stats.confirmed_bookings, icon: '✅', color: 'text-green-400' },
    { label: 'Игр сыграно', value: stats.total_games, icon: '🏁', color: 'text-purple-400' },
    { label: 'Выручка (сомони)', value: stats.total_revenue.toLocaleString(), icon: '💰', color: 'text-yellow-400' },
  ] : [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Дашборд</h1>
        <p className="text-neutral-400 text-sm mt-1">Taj Paintball — Панель управления</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map(card => (
          <div key={card.label} className="card p-4">
            <div className="text-2xl mb-2">{card.icon}</div>
            <div className={`text-2xl font-black ${card.color}`}>{card.value}</div>
            <div className="text-neutral-500 text-xs mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { href: '/admin/bookings', label: 'Все брони', icon: '📋', desc: 'Управление заявками' },
          { href: '/admin/bookings?status=awaiting_prepayment', label: 'Ждут предоплату', icon: '💰', desc: 'Требуют подтверждения' },
          { href: '/admin/history', label: 'История игр', icon: '🏁', desc: 'Архив завершённых' },
          { href: '/admin/pricing', label: 'Тарифы', icon: '🎯', desc: 'Цены и пакеты' },
        ].map(item => (
          <Link key={item.href} href={item.href}
            className="card p-4 hover:border-orange-500/50 transition-colors group">
            <div className="text-3xl mb-2">{item.icon}</div>
            <div className="text-white font-bold text-sm group-hover:text-orange-400 transition-colors">{item.label}</div>
            <div className="text-neutral-500 text-xs mt-1">{item.desc}</div>
          </Link>
        ))}
      </div>

      {/* Recent bookings */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <h2 className="text-white font-bold">Последние заявки</h2>
          <Link href="/admin/bookings" className="text-orange-400 text-sm hover:text-orange-300">Все →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-500 text-xs">
                <th className="text-left p-4">№ Брони</th>
                <th className="text-left p-4">Клиент</th>
                <th className="text-left p-4">Дата</th>
                <th className="text-left p-4">Игроки</th>
                <th className="text-left p-4">Сумма</th>
                <th className="text-left p-4">Статус</th>
              </tr>
            </thead>
            <tbody>
              {recent.map(b => (
                <tr key={b.id} className="border-b border-neutral-800/50 hover:bg-neutral-800/30 transition-colors">
                  <td className="p-4">
                    <Link href={`/admin/bookings/${b.id}`} className="text-orange-400 hover:text-orange-300 font-mono text-sm">
                      {b.booking_number}
                    </Link>
                  </td>
                  <td className="p-4">
                    <div className="text-white text-sm font-medium">{b.customer_name}</div>
                    <div className="text-neutral-500 text-xs">{b.customer_phone}</div>
                  </td>
                  <td className="p-4 text-neutral-300 text-sm">
                    {new Date(b.game_date).toLocaleDateString('ru-RU')} {b.game_time?.substring(0, 5)}
                  </td>
                  <td className="p-4 text-neutral-300 text-sm">{b.players_count} чел.</td>
                  <td className="p-4 text-white text-sm font-medium">{b.total_price} сом.</td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[b.booking_status] || 'bg-neutral-700 text-neutral-300'}`}>
                      {STATUS_LABELS[b.booking_status] || b.booking_status}
                    </span>
                  </td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-neutral-500">Нет заявок</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
