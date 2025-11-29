-- ============================================================
-- SPORJEGER DATABASE IMPROVEMENTS
-- Kjor dette i Supabase SQL Editor
-- ============================================================
-- Anbefalt rekkefolge:
-- 1. Data Sources tabell
-- 2. Nye felter i tools
-- 3. Audit log
-- 4. Import staging
-- 5. Data quality views
-- ============================================================


-- ============================================================
-- 1. DATA SOURCES - Sporing av hvor data kommer fra
-- ============================================================

CREATE TABLE IF NOT EXISTS data_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                    -- F.eks. 'awesome-osint'
  type TEXT NOT NULL DEFAULT 'manual',   -- 'github_repo', 'manual', 'api', 'import'
  url TEXT,                              -- GitHub URL eller API endpoint
  description TEXT,
  last_sync TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'never',      -- 'never', 'success', 'failed', 'in_progress'
  tool_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indeks for raskere oppslag
CREATE INDEX IF NOT EXISTS idx_data_sources_type ON data_sources(type);

-- Legg til en standard kilde for manuelt registrerte verktoy
INSERT INTO data_sources (id, name, type, description)
VALUES ('00000000-0000-0000-0000-000000000001', 'Manuell registrering', 'manual', 'Verktoy lagt til manuelt via admin')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 2. NYE FELTER I TOOLS - Sporbarhet og kvalitet
-- ============================================================

-- Kilde-referanse
ALTER TABLE tools ADD COLUMN IF NOT EXISTS source_id UUID REFERENCES data_sources(id);
ALTER TABLE tools ADD COLUMN IF NOT EXISTS source_url TEXT;           -- Original URL fra import

-- Import-tidspunkt
ALTER TABLE tools ADD COLUMN IF NOT EXISTS imported_at TIMESTAMPTZ;

-- URL-verifisering
ALTER TABLE tools ADD COLUMN IF NOT EXISTS last_checked TIMESTAMPTZ;
ALTER TABLE tools ADD COLUMN IF NOT EXISTS check_status TEXT DEFAULT 'unknown';  -- 'ok', 'broken', 'redirect', 'timeout', 'unknown'
ALTER TABLE tools ADD COLUMN IF NOT EXISTS check_status_code INT;                 -- HTTP status kode

-- Kvalitetsscore (0-100)
ALTER TABLE tools ADD COLUMN IF NOT EXISTS quality_score INT DEFAULT 0;

-- Indekser
CREATE INDEX IF NOT EXISTS idx_tools_source_id ON tools(source_id);
CREATE INDEX IF NOT EXISTS idx_tools_check_status ON tools(check_status);
CREATE INDEX IF NOT EXISTS idx_tools_quality_score ON tools(quality_score);


-- ============================================================
-- 3. AUDIT LOG - Logg alle endringer
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL,                  -- 'INSERT', 'UPDATE', 'DELETE'
  old_data JSONB,
  new_data JSONB,
  changed_fields TEXT[],                 -- Liste over endrede felter
  user_email TEXT,
  user_ip TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indekser for raskere soking i logg
CREATE INDEX IF NOT EXISTS idx_audit_log_table ON audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_record ON audit_log(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);

-- Trigger-funksjon for automatisk logging
CREATE OR REPLACE FUNCTION log_changes() RETURNS TRIGGER AS $$
DECLARE
  changed TEXT[];
  key TEXT;
BEGIN
  -- Finn endrede felter ved UPDATE
  IF TG_OP = 'UPDATE' THEN
    FOR key IN SELECT jsonb_object_keys(to_jsonb(NEW))
    LOOP
      IF to_jsonb(OLD) -> key IS DISTINCT FROM to_jsonb(NEW) -> key THEN
        changed := array_append(changed, key);
      END IF;
    END LOOP;
  END IF;

  INSERT INTO audit_log (table_name, record_id, action, old_data, new_data, changed_fields, user_email)
  VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    changed,
    COALESCE(current_setting('request.jwt.claims', true)::json->>'email', 'anonymous')
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aktiver logging for tools-tabellen
DROP TRIGGER IF EXISTS tools_audit_trigger ON tools;
CREATE TRIGGER tools_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON tools
  FOR EACH ROW EXECUTE FUNCTION log_changes();

-- Aktiver logging for categories-tabellen
DROP TRIGGER IF EXISTS categories_audit_trigger ON categories;
CREATE TRIGGER categories_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON categories
  FOR EACH ROW EXECUTE FUNCTION log_changes();


-- ============================================================
-- 4. IMPORT STAGING - Midlertidig tabell for import
-- ============================================================

CREATE TABLE IF NOT EXISTS import_staging (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES data_sources(id),

  -- Importert data
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  raw_data JSONB,                        -- Original data fra kilden

  -- Foreslatt kategorisering
  suggested_categories TEXT[],           -- Category slugs
  suggested_tool_type TEXT,
  suggested_pricing TEXT,

  -- Status
  status TEXT DEFAULT 'pending',         -- 'pending', 'approved', 'rejected', 'duplicate', 'merged'
  duplicate_of UUID REFERENCES tools(id),
  similarity_score FLOAT,                -- Hvor lik er den eksisterende verktoy (0-1)

  -- Metadata
  imported_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  notes TEXT,

  -- Resultat
  created_tool_id UUID REFERENCES tools(id)
);

-- Indekser
CREATE INDEX IF NOT EXISTS idx_import_staging_status ON import_staging(status);
CREATE INDEX IF NOT EXISTS idx_import_staging_source ON import_staging(source_id);
CREATE INDEX IF NOT EXISTS idx_import_staging_url ON import_staging(url);


-- ============================================================
-- 5. DATA QUALITY VIEWS
-- ============================================================

-- View: Verktoy med kvalitetsproblemer
CREATE OR REPLACE VIEW data_quality_issues AS
SELECT
  id,
  name,
  url,
  CASE
    WHEN description IS NULL THEN 'Mangler beskrivelse'
    WHEN LENGTH(COALESCE(description, '')) < 20 THEN 'For kort beskrivelse'
    WHEN url IS NULL OR url = '' THEN 'Mangler URL'
    WHEN intel_cycle_phases = '{}' OR intel_cycle_phases IS NULL THEN 'Mangler OSINT-faser'
    WHEN check_status = 'broken' THEN 'Dod lenke'
    WHEN check_status = 'unknown' AND last_checked IS NULL THEN 'Aldri verifisert'
    WHEN last_checked < NOW() - INTERVAL '90 days' THEN 'Ikke verifisert siste 90 dager'
  END as issue,
  CASE
    WHEN description IS NULL THEN 'high'
    WHEN url IS NULL THEN 'high'
    WHEN check_status = 'broken' THEN 'high'
    WHEN LENGTH(COALESCE(description, '')) < 20 THEN 'medium'
    WHEN intel_cycle_phases = '{}' THEN 'medium'
    ELSE 'low'
  END as severity,
  updated_at
FROM tools
WHERE is_active = true
  AND (
    description IS NULL
    OR LENGTH(COALESCE(description, '')) < 20
    OR url IS NULL
    OR url = ''
    OR intel_cycle_phases = '{}'
    OR intel_cycle_phases IS NULL
    OR check_status = 'broken'
    OR (check_status = 'unknown' AND last_checked IS NULL)
    OR last_checked < NOW() - INTERVAL '90 days'
  )
ORDER BY
  CASE
    WHEN description IS NULL OR url IS NULL OR check_status = 'broken' THEN 1
    ELSE 2
  END,
  updated_at DESC;


-- View: Overordnet datakvalitetsstatistikk
CREATE OR REPLACE VIEW data_quality_stats AS
SELECT
  COUNT(*) as total_tools,
  COUNT(*) FILTER (WHERE is_active = true) as active_tools,
  COUNT(*) FILTER (WHERE description IS NOT NULL AND LENGTH(description) >= 20) as has_good_description,
  COUNT(*) FILTER (WHERE array_length(intel_cycle_phases, 1) > 0) as has_phases,
  COUNT(*) FILTER (WHERE last_checked IS NOT NULL) as verified_count,
  COUNT(*) FILTER (WHERE last_checked > NOW() - INTERVAL '90 days') as recently_verified,
  COUNT(*) FILTER (WHERE check_status = 'ok') as working_urls,
  COUNT(*) FILTER (WHERE check_status = 'broken') as broken_urls,
  ROUND(100.0 * COUNT(*) FILTER (WHERE description IS NOT NULL AND LENGTH(description) >= 20) / NULLIF(COUNT(*), 0), 1) as description_pct,
  ROUND(100.0 * COUNT(*) FILTER (WHERE check_status = 'ok') / NULLIF(COUNT(*) FILTER (WHERE check_status IS NOT NULL AND check_status != 'unknown'), 0), 1) as url_health_pct,
  ROUND(AVG(quality_score), 0) as avg_quality_score
FROM tools;


-- View: Statistikk per datakilde
CREATE OR REPLACE VIEW source_stats AS
SELECT
  ds.id,
  ds.name,
  ds.type,
  ds.url,
  ds.last_sync,
  ds.sync_status,
  COUNT(t.id) as tool_count,
  COUNT(t.id) FILTER (WHERE t.is_active = true) as active_tool_count,
  ROUND(AVG(t.quality_score), 0) as avg_quality
FROM data_sources ds
LEFT JOIN tools t ON t.source_id = ds.id
GROUP BY ds.id, ds.name, ds.type, ds.url, ds.last_sync, ds.sync_status
ORDER BY tool_count DESC;


-- View: Import-ko oversikt
CREATE OR REPLACE VIEW import_queue AS
SELECT
  i.id,
  i.name,
  i.url,
  i.description,
  i.status,
  i.suggested_categories,
  i.similarity_score,
  i.duplicate_of,
  d.name as duplicate_name,
  s.name as source_name,
  i.imported_at
FROM import_staging i
LEFT JOIN tools d ON i.duplicate_of = d.id
LEFT JOIN data_sources s ON i.source_id = s.id
WHERE i.status = 'pending'
ORDER BY i.imported_at DESC;


-- ============================================================
-- 6. HJELPE-FUNKSJONER
-- ============================================================

-- Funksjon: Beregn kvalitetsscore for et verktoy
CREATE OR REPLACE FUNCTION calculate_quality_score(tool_id UUID) RETURNS INT AS $$
DECLARE
  score INT := 0;
  tool_record RECORD;
BEGIN
  SELECT * INTO tool_record FROM tools WHERE id = tool_id;

  IF NOT FOUND THEN RETURN 0; END IF;

  -- Har beskrivelse (maks 25 poeng)
  IF tool_record.description IS NOT NULL THEN
    IF LENGTH(tool_record.description) >= 100 THEN
      score := score + 25;
    ELSIF LENGTH(tool_record.description) >= 50 THEN
      score := score + 15;
    ELSIF LENGTH(tool_record.description) >= 20 THEN
      score := score + 10;
    END IF;
  END IF;

  -- Har URL som fungerer (maks 25 poeng)
  IF tool_record.check_status = 'ok' THEN
    score := score + 25;
  ELSIF tool_record.check_status = 'redirect' THEN
    score := score + 15;
  ELSIF tool_record.url IS NOT NULL AND tool_record.url != '' THEN
    score := score + 5;
  END IF;

  -- Har OSINT-faser (maks 15 poeng)
  IF array_length(tool_record.intel_cycle_phases, 1) >= 2 THEN
    score := score + 15;
  ELSIF array_length(tool_record.intel_cycle_phases, 1) = 1 THEN
    score := score + 10;
  END IF;

  -- Har kategorier (maks 15 poeng) - sjekk via tool_categories
  IF EXISTS (SELECT 1 FROM tool_categories WHERE tool_id = tool_record.id) THEN
    score := score + 15;
  END IF;

  -- Nylig verifisert (maks 10 poeng)
  IF tool_record.last_checked > NOW() - INTERVAL '30 days' THEN
    score := score + 10;
  ELSIF tool_record.last_checked > NOW() - INTERVAL '90 days' THEN
    score := score + 5;
  END IF;

  -- Har plattformer (maks 5 poeng)
  IF array_length(tool_record.platforms, 1) > 0 THEN
    score := score + 5;
  END IF;

  -- Har regioner (maks 5 poeng)
  IF array_length(tool_record.regions, 1) > 0 THEN
    score := score + 5;
  END IF;

  RETURN score;
END;
$$ LANGUAGE plpgsql;


-- Funksjon: Oppdater kvalitetsscore for alle verktoy
CREATE OR REPLACE FUNCTION update_all_quality_scores() RETURNS void AS $$
BEGIN
  UPDATE tools SET quality_score = calculate_quality_score(id);
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- 7. ROW LEVEL SECURITY (RLS) - Valgfritt
-- Aktiver dette nar du er klar for autentisering
-- ============================================================

-- Kommentert ut - aktiver manuelt nar du vil bruke Supabase Auth
/*
-- Aktiver RLS
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_staging ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Alle kan lese offentlige data
CREATE POLICY "Public read tools" ON tools FOR SELECT USING (is_active = true);
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read tool_categories" ON tool_categories FOR SELECT USING (true);

-- Kun autentiserte brukere kan skrive
CREATE POLICY "Auth write tools" ON tools FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth write categories" ON categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth write tool_categories" ON tool_categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth write data_sources" ON data_sources FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth write import_staging" ON import_staging FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth read audit_log" ON audit_log FOR SELECT USING (auth.role() = 'authenticated');
*/


-- ============================================================
-- VERIFISERING
-- ============================================================

-- Vis status for nye tabeller
SELECT 'data_sources' as table_name, COUNT(*) as rows FROM data_sources
UNION ALL
SELECT 'audit_log', COUNT(*) FROM audit_log
UNION ALL
SELECT 'import_staging', COUNT(*) FROM import_staging;

-- Vis nye kolonner i tools
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'tools'
  AND column_name IN ('source_id', 'source_url', 'imported_at', 'last_checked', 'check_status', 'quality_score')
ORDER BY ordinal_position;
