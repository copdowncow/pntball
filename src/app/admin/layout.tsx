'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [checked, setChecked] = useState(false);
  const [authed, setAuthed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === '/admin/login') { setChecked(true); return; }
    const token = localStorage.getItem('admin_token');
    if (!token) { router.push('/admin/login'); return; }
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        if (r.ok) { setAuthed(true); setChecked(true); }
        else { localStorage.removeItem('admin_token'); router.push('/admin/login'); }
      })
      .catch(() => router.push('/admin/login'));
  }, [pathname, router]);

  if (!checked) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-orange-500 text-2xl animate-pulse">⏳</div>
    </div>
  );

  if (pathname === '/admin/login') return <>{children}</>;
  if (!authed) return null;

  const navItems = [
    { href: '/admin', label: '📊 Дашборд' },
    { href: '/admin/bookings', label: '📋 Брони' },
    { href: '/admin/history', label: '🏁 История игр' },
    { href: '/admin/pricing', label: '💰 Тарифы' },
    { href: '/admin/settings', label: '⚙️ Настройки' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <aside className="w-64 hidden md:flex flex-col bg-neutral-900 border-r border-neutral-800 min-h-screen">
        <div className="p-6 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-orange-500">TAJ</span>
            <span className="text-xl font-black text-white">PAINTBALL</span>
          </div>
          <p className="text-neutral-500 text-xs mt-1">Панель управления</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                pathname === item.href
                  ? 'bg-orange-500 text-white'
                  : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
              }`}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-neutral-800">
          <Link href="/" className="text-neutral-500 hover:text-orange-400 text-xs transition-colors block mb-2">
            ← На сайт
          </Link>
          <button
            onClick={() => { localStorage.removeItem('admin_token'); router.push('/admin/login'); }}
            className="text-neutral-500 hover:text-red-400 text-xs transition-colors w-full text-left">
            Выйти
          </button>
        </div>
      </aside>
      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-neutral-900 border-t border-neutral-800 flex justify-around py-2">
        {navItems.map(item => (
          <Link key={item.href} href={item.href}
            className={`flex flex-col items-center text-xs py-1 px-2 rounded-lg transition-colors ${
              pathname === item.href ? 'text-orange-500' : 'text-neutral-500'
            }`}>
            <span className="text-lg">{item.label.split(' ')[0]}</span>
          </Link>
        ))}
      </div>
      <main className="flex-1 overflow-auto pb-20 md:pb-0">{children}</main>
    </div>
  );
}
