'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function AdminLoginPage() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { token } = await api.login(login, password);
      localStorage.setItem('admin_token', token);
      router.push('/admin');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Неверный логин или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-3xl font-black text-orange-500">TAJ</span>
            <span className="text-3xl font-black text-white">PAINTBALL</span>
          </div>
          <p className="text-neutral-400 text-sm">Панель администратора</p>
        </div>
        <div className="card p-8">
          <h1 className="text-xl font-bold text-white mb-6 text-center">Вход</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-neutral-400 mb-2">Логин</label>
              <input type="text" value={login} onChange={e => setLogin(e.target.value)}
                className="input-field" placeholder="admin" required />
            </div>
            <div>
              <label className="block text-sm text-neutral-400 mb-2">Пароль</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="input-field" placeholder="••••••••" required />
            </div>
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button type="submit" disabled={loading}
              className="btn-primary w-full disabled:opacity-50">
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
