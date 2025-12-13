-- ============================================================
-- ADD GUIDE FIELD TO TOOLS
-- Kjor dette i Supabase SQL Editor
-- ============================================================
-- Legger til et guide-felt for markdown-formatert tilleggsinfo
-- ============================================================

-- 1. Legg til guide-kolonne i tools-tabellen
ALTER TABLE tools ADD COLUMN IF NOT EXISTS guide TEXT;

-- 2. Kommenter kolonnen for dokumentasjon
COMMENT ON COLUMN tools.guide IS 'Markdown-formatert tilleggsinfo/veiledning for verktøyet';

-- 3. Oppdater tools_with_categories view for å inkludere guide
CREATE OR REPLACE VIEW tools_with_categories AS
SELECT
  t.id,
  t.name,
  t.slug,
  t.description,
  t.url,
  t.tool_type,
  t.requires_registration,
  t.requires_manual_url,
  t.pricing_model,
  t.platforms,
  t.intel_cycle_phases,
  t.regions,
  t.is_active,
  t.last_verified,
  t.verified_by,
  t.quality_score,
  t.updated_at,
  t.guide,
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

-- 4. Verifiser at kolonnen ble opprettet
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tools' AND column_name = 'guide';
