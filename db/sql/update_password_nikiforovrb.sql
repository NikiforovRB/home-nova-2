-- Обновление только пароля и роли для указанного пользователя.
-- Email: nikiforovrb@yandex.ru
-- Пароль в открытом виде: 1vngbwxcn78fg567
-- Роль: администратор (roles.code = 'admin')
--
-- Хеш bcrypt ($2b$, 12 раундов), совместим с приложением (bcryptjs).

UPDATE users u
SET
  password_hash = '$2b$12$GAifhNDlsdghhavJet07jOX68WCviqRhNYjuJtyDlsUr26HH95V5a',
  role_id = (SELECT id FROM roles WHERE code = 'admin' LIMIT 1)
WHERE u.email = 'nikiforovrb@yandex.ru';

-- Проверка: должна быть затронута 1 строка. Если 0 — пользователя с таким email нет.
