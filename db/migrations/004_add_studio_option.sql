BEGIN;

-- Добавляем "Студия" в селекты комнат, если такого значения ещё нет.
UPDATE property_filter_definitions
SET options_json = COALESCE(options_json, '[]'::jsonb) || '["Студия"]'::jsonb
WHERE field_type = 'select'
  AND field_key IN ('rooms', 'room_count', 'rooms_count')
  AND NOT COALESCE(options_json, '[]'::jsonb) @> '["Студия"]'::jsonb;

COMMIT;
