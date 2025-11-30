-- Legg til registration_type felt for å støtte "Delvis" registrering
-- Kjør dette i Supabase Dashboard > SQL Editor

-- Opprett enum type
DO $$ BEGIN
  CREATE TYPE registration_type AS ENUM ('none', 'partial', 'required');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Legg til kolonne
ALTER TABLE tools
ADD COLUMN IF NOT EXISTS registration_type registration_type DEFAULT 'none';

-- Migrer eksisterende data basert på requires_registration
UPDATE tools
SET registration_type = CASE
  WHEN requires_registration = true THEN 'required'::registration_type
  ELSE 'none'::registration_type
END
WHERE registration_type IS NULL OR registration_type = 'none';

-- Oppdater view for å inkludere registration_type
DROP VIEW IF EXISTS tools_with_categories;

CREATE VIEW tools_with_categories AS
SELECT
  t.*,
  COALESCE(
    array_agg(DISTINCT c.slug) FILTER (WHERE c.slug IS NOT NULL),
    ARRAY[]::text[]
  ) as category_slugs,
  COALESCE(
    array_agg(DISTINCT c.name) FILTER (WHERE c.name IS NOT NULL),
    ARRAY[]::text[]
  ) as category_names
FROM tools t
LEFT JOIN tool_categories tc ON t.id = tc.tool_id
LEFT JOIN categories c ON tc.category_id = c.id
GROUP BY t.id;

-- Verifiser
SELECT registration_type, COUNT(*) FROM tools GROUP BY registration_type;
