-- Пароль: 1vngbwxcn78fg567 (bcrypt 12 раундов, как в приложении)
-- Выполнить после миграции 001_init.sql при необходимости ручного сидирования.

INSERT INTO users (email, password_hash, name, role_id)
SELECT
  'nikiforovrb@yandex.ru',
  '$2b$12$MyBhV67oVPmJyJp6KycNQ.TanOSmSgUfrdRAcsF/NuFvpW89ZFo9S',
  'Администратор HOMENOVA',
  r.id
FROM roles r
WHERE r.code = 'admin'
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  role_id = EXCLUDED.role_id,
  name = EXCLUDED.name;
