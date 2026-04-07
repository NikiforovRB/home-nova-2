# HOMENOVA

Платформа объявлений недвижимости: Next.js (App Router), PostgreSQL (SQL-миграции), S3, JWT.

## Запуск

```bash
npm install
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000). Вход и регистрация: [http://localhost:3000/login](http://localhost:3000/login).

## Переменные окружения

В корне используется `.env`. Для публичных URL медиа из S3 задайте:

- `NEXT_PUBLIC_MEDIA_BASE` — базовый URL бакета, например `https://s3.twcstorage.ru/имя-бакета`

## БД и SQL

- Миграция: `db/migrations/001_init.sql`
- Применение: `npm run db:migrate`
- Первый администратор: `npm run db:seed` (или `db/seed/001_admin.sql`)

Если у пользователя БД нет прав на `CREATE` в схеме `public`, выдайте права владельцем БД:

```sql
GRANT USAGE, CREATE ON SCHEMA public TO gen_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO gen_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO gen_user;
```

Затем снова выполните `npm run db:migrate` и `npm run db:seed`.

## Маршруты

- `/` — главная, фильтры, рекомендации
- `/catalog` — каталог
- `/listing/{publicNumber}-{slug}` — карточка объявления (ЧПУ)
- `/login` — вход и регистрация
- `/superadmin-lk` — панель администратора (роль `admin`)

## Сборка

```bash
npm run build
```
