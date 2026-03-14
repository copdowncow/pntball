# Деплой Taj Paintball

## Архитектура
Чистый Next.js 14 App Router — без Express.
API Routes = /src/app/api/**
Telegram Bot стартует через instrumentation.ts

## Railway
1. Загрузить ZIP → Railway видит package.json в корне
2. Добавить переменные (.env.example):
   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
   TELEGRAM_BOT_TOKEN, TELEGRAM_ADMIN_CHAT_ID
   JWT_SECRET, ADMIN_LOGIN, ADMIN_PASSWORD
   NODE_ENV=production
3. Deploy → npm run build && npm run start

## Создать администратора
В Railway → Settings → Deploy → Start Command временно поменять на:
  npx ts-node --compiler-options '{"module":"commonjs"}' src/scripts/createAdmin.ts
После создания вернуть обратно: npm run start

## Ошибка Telegram 409
Если видишь "Conflict: terminated by other getUpdates" — 
просто перезапусти сервис в Railway. Это значит работает 2 копии бота.
