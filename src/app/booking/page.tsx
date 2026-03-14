'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface TimeSlot { id: string; slot_time: string; is_available: boolean; }

export default function BookingPage() {
  const [step, setStep] = useState(1);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{ booking_number: string; total_price: number; prepayment_amount: number } | null>(null);
  const [error, setError] = useState('');
  const [priceCalc, setPriceCalc] = useState<{ total_price: number; prepayment_amount: number } | null>(null);

  const [form, setForm] = useState({
    game_date: '', game_time: '',
    customer_name: '', customer_phone: '',
    players_count: 4, balls_count: 300,
    customer_comment: '', agree_terms: false,
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];
  const maxDate = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

  useEffect(() => {
    if (form.game_date) {
      api.getSlots(form.game_date).then(setSlots).catch(() => setSlots([]));
    }
  }, [form.game_date]);

  useEffect(() => {
    if (form.balls_count >= 100) {
      api.calculatePrice(form.balls_count)
        .then(setPriceCalc)
        .catch(() => setPriceCalc({ total_price: (form.balls_count / 100) * 70, prepayment_amount: 50 }));
    }
  }, [form.balls_count]);

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));
  const totalPrice = priceCalc?.total_price ?? (form.balls_count / 100 * 70);
  const prepayment = priceCalc?.prepayment_amount ?? 50;

  const handleSubmit = async () => {
    setError('');
    if (!form.agree_terms) { setError('Необходимо согласие с условиями'); return; }
    setLoading(true);
    try {
      const result = await api.createBooking(form);
      setSuccess(result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка отправки заявки');
    } finally { setLoading(false); }
  };

  if (success) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm text-center">
        <div className="text-6xl mb-5">🎯</div>
        <h1 className="text-2xl font-black text-white mb-2">Заявка принята!</h1>
        <p className="text-neutral-400 text-sm mb-6">Ожидайте подтверждения от администратора</p>
        <div className="card p-5 mb-5 text-left space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-neutral-400 text-sm">Номер брони:</span>
            <span className="text-orange-400 font-black text-lg">{success.booking_number}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-neutral-400 text-sm">Итого:</span>
            <span className="text-white font-bold">{success.total_price} сомони</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-neutral-400 text-sm">Предоплата:</span>
            <span className="text-orange-400 font-bold">{success.prepayment_amount} сомони</span>
          </div>
        </div>
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4 mb-6 text-sm text-orange-300 leading-relaxed">
          📞 Администратор свяжется с вами для подтверждения предоплаты {success.prepayment_amount} сомони
        </div>
        <Link href="/" className="btn-primary w-full py-4 rounded-2xl">На главную</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-8">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/90 backdrop-blur-md border-b border-neutral-800 px-4 py-3 flex items-center gap-3">
        <Link href="/" className="text-neutral-400 p-1" style={{ WebkitTapHighlightColor: 'transparent' }}>
          ←
        </Link>
        <div>
          <h1 className="text-base font-black text-white">Бронирование</h1>
          <p className="text-neutral-500 text-xs">Шаг {step} из 3</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-neutral-800">
        <div className="h-full bg-orange-500 transition-all duration-300" style={{ width: `${(step / 3) * 100}%` }} />
      </div>

      <div className="px-4 py-6 max-w-lg mx-auto">
        {/* Step labels */}
        <div className="flex items-center gap-2 mb-6">
          {['Дата и время', 'Данные', 'Подтверждение'].map((s, i) => (
            <div key={s} className="flex items-center gap-1.5 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                step > i + 1 ? 'bg-green-500 text-white' :
                step === i + 1 ? 'bg-orange-500 text-white' :
                'bg-neutral-800 text-neutral-500'}`}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
              <span className={`text-xs hidden sm:block ${step === i + 1 ? 'text-white' : 'text-neutral-600'}`}>{s}</span>
              {i < 2 && <div className="flex-1 h-px bg-neutral-800 ml-1" />}
            </div>
          ))}
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Дата игры *</label>
              <input type="date" min={minDate} max={maxDate} value={form.game_date}
                onChange={e => { set('game_date', e.target.value); set('game_time', ''); }}
                className="input-field" />
            </div>

            {form.game_date && (
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-3">Время *</label>
                {slots.length === 0 ? (
                  <div className="text-neutral-500 text-sm py-4 text-center">Загрузка...</div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {slots.map(slot => (
                      <button key={slot.id}
                        disabled={!slot.is_available}
                        onClick={() => set('game_time', slot.slot_time.substring(0, 5))}
                        style={{ WebkitTapHighlightColor: 'transparent' }}
                        className={`py-3 rounded-xl text-sm font-medium transition-all ${
                          !slot.is_available
                            ? 'bg-neutral-800/50 text-neutral-600 line-through cursor-not-allowed'
                            : form.game_time === slot.slot_time.substring(0, 5)
                            ? 'bg-orange-500 text-white'
                            : 'bg-neutral-800 text-neutral-300 active:bg-neutral-700'
                        }`}>
                        {slot.slot_time.substring(0, 5)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {error && <p className="text-red-400 text-sm bg-red-500/10 rounded-xl px-4 py-3">{error}</p>}

            <button onClick={() => {
              if (!form.game_date) { setError('Выберите дату'); return; }
              if (!form.game_time) { setError('Выберите время'); return; }
              setError(''); setStep(2);
            }} className="btn-primary w-full py-4 rounded-2xl text-base mt-2">
              Далее →
            </button>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Ваше имя *</label>
              <input type="text" placeholder="Али Рахимов" value={form.customer_name}
                onChange={e => set('customer_name', e.target.value)} className="input-field"
                autoComplete="name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Номер телефона *</label>
              <input type="tel" placeholder="+992 XX XXX XXXX" value={form.customer_phone}
                onChange={e => set('customer_phone', e.target.value)} className="input-field"
                autoComplete="tel" inputMode="tel" />
            </div>

            {/* Players counter */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Количество игроков</label>
              <div className="bg-neutral-800 border border-neutral-700 rounded-xl flex items-center justify-between px-4 py-3">
                <button onClick={() => set('players_count', Math.max(1, form.players_count - 1))}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                  className="w-10 h-10 rounded-full bg-neutral-700 active:bg-neutral-600 flex items-center justify-center text-white text-xl font-bold">
                  −
                </button>
                <div className="text-center">
                  <div className="text-2xl font-black text-orange-500">{form.players_count}</div>
                  <div className="text-xs text-neutral-500">человек</div>
                </div>
                <button onClick={() => set('players_count', Math.min(50, form.players_count + 1))}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                  className="w-10 h-10 rounded-full bg-neutral-700 active:bg-neutral-600 flex items-center justify-center text-white text-xl font-bold">
                  +
                </button>
              </div>
            </div>

            {/* Balls selector */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Количество шаров</label>
              <div className="grid grid-cols-3 gap-2">
                {[100, 200, 300, 500, 700, 1000].map(n => (
                  <button key={n} onClick={() => set('balls_count', n)}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                    className={`py-3 px-2 rounded-xl text-sm font-medium transition-all ${
                      form.balls_count === n
                        ? 'bg-orange-500 text-white'
                        : 'bg-neutral-800 text-neutral-300 active:bg-neutral-700'
                    }`}>
                    <div className="font-bold">{n}</div>
                    <div className="text-xs opacity-70">{n / 100 * 70} сом</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Комментарий</label>
              <textarea placeholder="День рождения, особые пожелания..." value={form.customer_comment}
                onChange={e => set('customer_comment', e.target.value)}
                className="input-field resize-none" rows={3} />
            </div>

            {error && <p className="text-red-400 text-sm bg-red-500/10 rounded-xl px-4 py-3">{error}</p>}

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setStep(1)}
                className="btn-secondary py-4 rounded-2xl text-sm">← Назад</button>
              <button onClick={() => {
                if (!form.customer_name.trim()) { setError('Введите имя'); return; }
                if (!form.customer_phone.trim()) { setError('Введите телефон'); return; }
                setError(''); setStep(3);
              }} className="btn-primary py-4 rounded-2xl text-sm">Далее →</button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="card p-5 space-y-3">
              {[
                ['📅 Дата', `${new Date(form.game_date).toLocaleDateString('ru-RU')} в ${form.game_time}`],
                ['👤 Имя', form.customer_name],
                ['📞 Телефон', form.customer_phone],
                ['👥 Игроков', `${form.players_count} чел.`],
                ['🎯 Шаров', `${form.balls_count} шт.`],
                ...(form.customer_comment ? [['💬', form.customer_comment]] : []),
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-start gap-3 text-sm">
                  <span className="text-neutral-500 flex-shrink-0">{label}</span>
                  <span className="text-white text-right">{value}</span>
                </div>
              ))}
              <div className="border-t border-neutral-800 pt-3 mt-1 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400 text-sm">Итого:</span>
                  <span className="text-white font-black text-xl">{totalPrice} сом.</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-orange-400 text-sm">Предоплата сейчас:</span>
                  <span className="text-orange-400 font-black text-xl">{prepayment} сом.</span>
                </div>
              </div>
            </div>

            <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4 text-sm text-orange-300 leading-relaxed">
              💡 После отправки заявки администратор свяжется с вами для получения предоплаты <strong>{prepayment} сомони</strong>. Предоплата возвращается после игры.
            </div>

            <label className="flex items-start gap-3 cursor-pointer p-4 bg-neutral-900 border border-neutral-800 rounded-2xl active:bg-neutral-800"
              style={{ WebkitTapHighlightColor: 'transparent' }}>
              <input type="checkbox" checked={form.agree_terms}
                onChange={e => set('agree_terms', e.target.checked)}
                className="mt-0.5 w-5 h-5 accent-orange-500 flex-shrink-0" />
              <span className="text-sm text-neutral-300 leading-relaxed">
                Согласен с условиями бронирования, правилами безопасности и обязуюсь внести предоплату
              </span>
            </label>

            {error && <p className="text-red-400 text-sm bg-red-500/10 rounded-xl px-4 py-3">{error}</p>}

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setStep(2)}
                className="btn-secondary py-4 rounded-2xl text-sm">← Назад</button>
              <button onClick={handleSubmit} disabled={loading}
                className="btn-primary py-4 rounded-2xl text-sm disabled:opacity-50">
                {loading ? '⏳...' : '✅ Отправить'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
