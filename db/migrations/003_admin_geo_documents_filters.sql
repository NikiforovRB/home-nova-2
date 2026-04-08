BEGIN;

CREATE TABLE countries (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT countries_name_unique UNIQUE (name)
);

CREATE TABLE regions (
  id BIGSERIAL PRIMARY KEY,
  country_id BIGINT NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (country_id, name)
);

CREATE TABLE cities (
  id BIGSERIAL PRIMARY KEY,
  region_id BIGINT NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (region_id, name)
);

INSERT INTO countries (name, sort_order)
SELECT country, ROW_NUMBER() OVER (ORDER BY country)::int
FROM (SELECT DISTINCT country FROM locations) d;

INSERT INTO regions (country_id, name, sort_order)
SELECT c.id, dr.region, 0
FROM (SELECT DISTINCT country, region FROM locations) dr
JOIN countries c ON c.name = dr.country;

INSERT INTO cities (region_id, name, sort_order)
SELECT r.id, loc.city, 0
FROM locations loc
JOIN countries c ON c.name = loc.country
JOIN regions r ON r.country_id = c.id AND r.name = loc.region;

ALTER TABLE listings ADD COLUMN city_id_new BIGINT REFERENCES cities(id);

UPDATE listings li
SET city_id_new = ct.id
FROM locations old
JOIN countries c ON c.name = old.country
JOIN regions r ON r.country_id = c.id AND r.name = old.region
JOIN cities ct ON ct.region_id = r.id AND ct.name = old.city
WHERE li.city_id = old.id;

DO $$
BEGIN
  IF (SELECT COUNT(*) FROM cities) = 0 THEN
    INSERT INTO countries (name, sort_order) VALUES ('Россия', 0) ON CONFLICT (name) DO NOTHING;
    INSERT INTO regions (country_id, name, sort_order)
    SELECT c.id, 'Москва', 0 FROM countries c WHERE c.name = 'Россия' LIMIT 1
    ON CONFLICT (country_id, name) DO NOTHING;
    INSERT INTO cities (region_id, name, sort_order)
    SELECT r.id, 'Москва', 0 FROM regions r
    JOIN countries c ON c.id = r.country_id
    WHERE c.name = 'Россия' AND r.name = 'Москва' LIMIT 1
    ON CONFLICT (region_id, name) DO NOTHING;
  END IF;
END $$;

UPDATE listings
SET city_id_new = (SELECT id FROM cities ORDER BY id LIMIT 1)
WHERE city_id_new IS NULL;

ALTER TABLE listings DROP CONSTRAINT listings_city_id_fkey;

ALTER TABLE listings DROP COLUMN city_id;

ALTER TABLE listings RENAME COLUMN city_id_new TO city_id;

ALTER TABLE listings ALTER COLUMN city_id SET NOT NULL;

DROP TABLE locations;

CREATE TABLE site_documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO site_documents (id, title, body) VALUES
  ('privacy', 'Политика конфиденциальности', 'Здесь размещается текст политики конфиденциальности платформы HOMENOVA.'),
  ('privacy-processing', 'Политика обработки персональных данных', 'Здесь размещается текст политики обработки персональных данных платформы HOMENOVA.')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE property_filter_definitions (
  id BIGSERIAL PRIMARY KEY,
  property_type TEXT NOT NULL,
  field_key TEXT NOT NULL,
  label TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'number', 'select')),
  options_json JSONB,
  sort_order INT NOT NULL DEFAULT 0,
  UNIQUE (property_type, field_key)
);

CREATE TABLE listing_filter_values (
  listing_id BIGINT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  filter_def_id BIGINT NOT NULL REFERENCES property_filter_definitions(id) ON DELETE CASCADE,
  value TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (listing_id, filter_def_id)
);

CREATE INDEX idx_listing_filter_values_listing ON listing_filter_values (listing_id);
CREATE INDEX idx_filter_defs_property ON property_filter_definitions (property_type);

COMMIT;
