'use client';
import Link from 'next/link';
import { useState } from 'react';

const REVIEWS = [
  { name: 'Алишер Р.', text: 'Отличное место! Отмечали день рождения — все в восторге. Персонал профессиональный.', rating: 5 },
  { name: 'Диана М.', text: 'Были с командой с работы. Организовали корпоратив — незабываемо! Рекомендую всем.', rating: 5 },
  { name: 'Фарход Н.', text: 'Бронировали онлайн — очень удобно. Приехали, всё было готово. Обязательно вернёмся.', rating: 5 },
];

const ADVANTAGES = [
  { icon: '🎯', title: 'Проф. оборудование', desc: 'Качественные маркеры и защитные маски международного класса' },
  { icon: '🌿', title: 'Большая игровая зона', desc: 'Просторные поля с природным ландшафтом и укрытиями' },
  { icon: '👨‍🏫', title: 'Опытные инструкторы', desc: 'Проведут инструктаж и помогут организовать игру' },
  { icon: '🎉', title: 'Мероприятия под ключ', desc: 'Дни рождения, корпоративы, турниры' },
  { icon: '🛡️', title: 'Безопасность', desc: 'Строгие правила и качественная защитная экипировка' },
  { icon: '💰', title: 'Доступные цены', desc: 'Честная цена — 70 сомони за 100 шаров' },
];

const PACKAGES = [
  { balls: 100, price: 70, label: 'Старт' },
  { balls: 200, price: 140, label: 'Базовый' },
  { balls: 300, price: 210, label: 'Стандарт' },
  { balls: 500, price: 350, label: 'Комфорт', popular: true },
  { balls: 700, price: 490, label: 'Про' },
  { balls: 1000, price: 700, label: 'Максимум' },
];

const STEPS = [
  { step: '01', title: 'Бронируйте онлайн', desc: 'Выберите дату, время и количество игроков. Предоплата 50 сомони.' },
  { step: '02', title: 'Приезжайте', desc: 'Приходите в назначенное время — наша команда встретит вас.' },
  { step: '03', title: 'Получите снаряжение', desc: 'Маркер, маска, защитный жилет и шары — всё включено.' },
  { step: '04', title: 'В бой!', desc: 'Инструктаж, команды, сигнал — начинается незабываемая битва!' },
];

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">

      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-neutral-800">
        <div className="px-4 py-3 flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-1">
            <span className="text-xl font-black text-orange-500">TAJ</span>
            <span className="text-xl font-black text-white">PAINTBALL</span>
          </div>
          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-300">
            <a href="#prices" className="hover:text-orange-400 transition-colors">Цены</a>
            <a href="#how" className="hover:text-orange-400 transition-colors">Как это работает</a>
            <a href="#reviews" className="hover:text-orange-400 transition-colors">Отзывы</a>
            <a href="#contacts" className="hover:text-orange-400 transition-colors">Контакты</a>
            <Link href="/booking" className="btn-primary py-2 px-5 text-sm rounded-xl">Забронировать</Link>
          </div>
          {/* Mobile menu button */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ WebkitTapHighlightColor: 'transparent' }}>
            <span className={`block w-6 h-0.5 bg-white transition-all ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-6 h-0.5 bg-white transition-all ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-6 h-0.5 bg-white transition-all ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>
        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-neutral-950 border-t border-neutral-800 px-4 py-4 flex flex-col gap-1">
            {[['#prices','Цены'],['#how','Как это работает'],['#reviews','Отзывы'],['#contacts','Контакты']].map(([href, label]) => (
              <a key={href} href={href}
                className="text-neutral-300 py-3 px-3 rounded-xl hover:bg-neutral-800 transition-colors text-base font-medium"
                onClick={() => setMenuOpen(false)}>{label}</a>
            ))}
            <Link href="/booking" className="btn-primary mt-2 w-full text-center rounded-xl py-3"
              onClick={() => setMenuOpen(false)}>
              🎯 Забронировать игру
            </Link>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center pt-16">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-950/30 via-black to-black" />
        <div className="relative z-10 text-center px-4 w-full max-w-2xl mx-auto py-16">
          <div className="inline-flex items-center gap-2 bg-orange-500/15 border border-orange-500/30 rounded-full px-4 py-2 text-orange-400 text-sm font-medium mb-6">
            🎯 Лучший пейнтбол в Таджикистане
          </div>
          <h1 className="font-black mb-4 leading-none">
            <span className="block text-6xl sm:text-8xl gradient-text">TAJ</span>
            <span className="block text-5xl sm:text-7xl text-white">PAINTBALL</span>
          </h1>
          <p className="text-lg sm:text-xl text-neutral-300 mb-3 leading-relaxed">
            Адреналин, командный дух и незабываемые эмоции
          </p>
          <p className="text-neutral-500 text-sm mb-10 leading-relaxed">
            Профессиональное снаряжение · Большие поля · Опытные инструкторы · Душанбе
          </p>
          <div className="flex flex-col gap-3 px-2">
            <Link href="/booking" className="btn-primary w-full text-lg py-5 rounded-2xl">
              🎯 Забронировать игру
            </Link>
            <a href="#how" className="btn-secondary w-full text-lg py-5 rounded-2xl">
              Как это работает
            </a>
          </div>
          {/* Stats */}
          <div className="mt-12 grid grid-cols-3 gap-4">
            {[['500+', 'Игр проведено'], ['98%', 'Довольных гостей'], ['5★', 'Рейтинг']].map(([n, l]) => (
              <div key={l} className="bg-neutral-900/60 rounded-2xl py-4 px-2">
                <div className="text-2xl font-black text-orange-500">{n}</div>
                <div className="text-xs text-neutral-400 mt-1 leading-tight">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICES */}
      <section id="prices" className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="section-title mb-3">Цены и <span className="gradient-text">пакеты</span></h2>
            <p className="text-neutral-400">100 шаров = 70 сомони</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            {PACKAGES.map(pkg => (
              <div key={pkg.balls} className={`card p-4 text-center relative ${pkg.popular ? 'border-orange-500 ring-1 ring-orange-500' : ''}`}>
                {pkg.popular && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs font-bold px-3 py-0.5 rounded-full whitespace-nowrap">
                    Популярный
                  </div>
                )}
                <div className="text-2xl font-black text-orange-500 mt-1">{pkg.price}</div>
                <div className="text-xs text-neutral-400">сомони</div>
                <div className="text-sm font-bold text-white mt-2">{pkg.balls} шаров</div>
                <div className="text-xs text-neutral-500 mt-0.5">{pkg.label}</div>
              </div>
            ))}
          </div>
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4 text-center">
            <p className="text-sm text-neutral-300 leading-relaxed">
              <span className="text-orange-400 font-bold">Предоплата 50 сомони</span> — возвращается после игры
            </p>
          </div>
        </div>
      </section>

      {/* ADVANTAGES */}
      <section className="py-16 px-4 bg-neutral-900/40">
        <div className="max-w-6xl mx-auto">
          <h2 className="section-title mb-8 text-center">Почему <span className="gradient-text">Taj Paintball</span></h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ADVANTAGES.map(adv => (
              <div key={adv.title} className="card p-5">
                <div className="text-3xl mb-3">{adv.icon}</div>
                <h3 className="text-base font-bold text-white mb-1">{adv.title}</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">{adv.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="section-title mb-8 text-center">Как проходит <span className="gradient-text">игра</span></h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {STEPS.map(step => (
              <div key={step.step} className="card p-5 flex gap-4 items-start">
                <div className="text-4xl font-black text-orange-500/30 leading-none flex-shrink-0">{step.step}</div>
                <div>
                  <h3 className="text-base font-bold text-white mb-1">{step.title}</h3>
                  <p className="text-neutral-400 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RULES */}
      <section className="py-16 px-4 bg-neutral-900/40">
        <div className="max-w-4xl mx-auto">
          <h2 className="section-title mb-6 text-center">Правила <span className="gradient-text">безопасности</span></h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              'Обязательно надевать маску на поле',
              'Не снимать маску до окончания игры',
              'Стрелять только в игровой зоне',
              'Слушать инструктора',
              'Не целиться в незащищённые части тела',
              'Дети до 12 лет — только со взрослыми',
              'Запрещено нахождение в нетрезвом виде',
              'При попадании поднять руку и покинуть поле',
            ].map(rule => (
              <div key={rule} className="flex items-start gap-3 bg-neutral-900 border border-neutral-800 rounded-xl p-4">
                <span className="text-orange-500 font-bold text-lg leading-none mt-0.5">✓</span>
                <p className="text-neutral-300 text-sm leading-relaxed">{rule}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section id="reviews" className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="section-title mb-8 text-center">Отзывы <span className="gradient-text">гостей</span></h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {REVIEWS.map(review => (
              <div key={review.name} className="card p-5">
                <div className="text-yellow-400 text-base mb-3">{'★'.repeat(review.rating)}</div>
                <p className="text-neutral-300 text-sm leading-relaxed mb-4">{review.text}</p>
                <div className="text-orange-400 font-semibold text-sm">{review.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="max-w-xl mx-auto">
          <div className="bg-gradient-to-b from-orange-500/10 to-red-900/10 border border-orange-500/30 rounded-3xl p-8 text-center">
            <h2 className="section-title mb-3">Готов к <span className="gradient-text">битве?</span></h2>
            <p className="text-neutral-400 mb-8 text-sm leading-relaxed">
              Забронируй игру прямо сейчас — онлайн, быстро и удобно
            </p>
            <Link href="/booking" className="btn-primary w-full text-lg py-5 rounded-2xl">
              🎯 Забронировать игру
            </Link>
          </div>
        </div>
      </section>

      {/* CONTACTS */}
      <section id="contacts" className="py-16 px-4 bg-neutral-900/40">
        <div className="max-w-6xl mx-auto">
          <h2 className="section-title mb-8 text-center">Контакты</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {[
              { icon: '📍', title: 'Адрес', val: 'Душанбе, Таджикистан' },
              { icon: '📞', title: 'Телефон', val: '+992 XX XXX XXXX', href: 'tel:+992000000000' },
              { icon: '🕐', title: 'Режим работы', val: 'Ежедневно 10:00 – 21:00' },
            ].map(c => (
              <div key={c.title} className="card p-5 text-center">
                <div className="text-3xl mb-3">{c.icon}</div>
                <div className="text-white font-bold mb-1 text-sm">{c.title}</div>
                {c.href
                  ? <a href={c.href} className="text-orange-400 text-sm">{c.val}</a>
                  : <p className="text-neutral-400 text-sm">{c.val}</p>}
              </div>
            ))}
          </div>
          {/* Call button */}
          <a href="tel:+992000000000"
            className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold py-4 rounded-2xl text-base transition-colors"
            style={{ WebkitTapHighlightColor: 'transparent' }}>
            📞 Позвонить нам
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 px-4 border-t border-neutral-800">
        <div className="max-w-6xl mx-auto text-center space-y-2">
          <div className="flex items-center justify-center gap-1">
            <span className="text-xl font-black text-orange-500">TAJ</span>
            <span className="text-xl font-black">PAINTBALL</span>
          </div>
          <p className="text-neutral-600 text-xs">© 2024 Taj Paintball. Все права защищены.</p>
          <Link href="/admin" className="text-neutral-700 hover:text-neutral-500 text-xs transition-colors">
            Панель управления
          </Link>
        </div>
      </footer>
    </div>
  );
}
