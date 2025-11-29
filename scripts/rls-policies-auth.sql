-- ============================================================
-- RLS-POLICYER MED SUPABASE AUTH FOR SPORJEGER
-- Kjor dette i Supabase SQL Editor ETTER at du har aktivert Email auth
-- ============================================================
--
-- FORUTSETNINGER:
-- 1. Email auth er aktivert i Supabase Dashboard > Authentication > Providers
-- 2. Du har logget inn minst en gang med e-postadressen din
--
-- Dette scriptet erstatter de apne policyene med auth-baserte policyer.
-- Kun innloggede brukere kan opprette og endre data.
-- Alle kan fortsatt lese data (for sokeappen).
--
-- Scriptet kan kjores flere ganger (idempotent)
-- ============================================================


-- ============================================================
-- TOOLS - Les for alle, skriv for innloggede
-- ============================================================

-- Fjern gamle offentlige policyer
DROP POLICY IF EXISTS "Public insert tools" ON tools;
DROP POLICY IF EXISTS "Public update tools" ON tools;

-- Opprett auth-baserte policyer
DROP POLICY IF EXISTS "Auth insert tools" ON tools;
CREATE POLICY "Auth insert tools" ON tools
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth update tools" ON tools;
CREATE POLICY "Auth update tools" ON tools
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');


-- ============================================================
-- CATEGORIES - Les for alle, skriv for innloggede
-- ============================================================

-- Fjern gamle offentlige policyer
DROP POLICY IF EXISTS "Public insert categories" ON categories;
DROP POLICY IF EXISTS "Public update categories" ON categories;

-- Opprett auth-baserte policyer
DROP POLICY IF EXISTS "Auth insert categories" ON categories;
CREATE POLICY "Auth insert categories" ON categories
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth update categories" ON categories;
CREATE POLICY "Auth update categories" ON categories
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');


-- ============================================================
-- TOOL_CATEGORIES - Les for alle, skriv for innloggede
-- ============================================================

-- Fjern gamle offentlige policyer
DROP POLICY IF EXISTS "Public insert tool_categories" ON tool_categories;
DROP POLICY IF EXISTS "Public update tool_categories" ON tool_categories;
DROP POLICY IF EXISTS "Public delete tool_categories" ON tool_categories;

-- Opprett auth-baserte policyer
DROP POLICY IF EXISTS "Auth insert tool_categories" ON tool_categories;
CREATE POLICY "Auth insert tool_categories" ON tool_categories
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth update tool_categories" ON tool_categories;
CREATE POLICY "Auth update tool_categories" ON tool_categories
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth delete tool_categories" ON tool_categories;
CREATE POLICY "Auth delete tool_categories" ON tool_categories
  FOR DELETE
  USING (auth.role() = 'authenticated');


-- ============================================================
-- DATA_SOURCES - Les for alle, skriv for innloggede
-- ============================================================

-- Fjern gamle offentlige policyer
DROP POLICY IF EXISTS "Public insert data_sources" ON data_sources;
DROP POLICY IF EXISTS "Public update data_sources" ON data_sources;
DROP POLICY IF EXISTS "Public delete data_sources" ON data_sources;

-- Opprett auth-baserte policyer
DROP POLICY IF EXISTS "Auth insert data_sources" ON data_sources;
CREATE POLICY "Auth insert data_sources" ON data_sources
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth update data_sources" ON data_sources;
CREATE POLICY "Auth update data_sources" ON data_sources
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth delete data_sources" ON data_sources;
CREATE POLICY "Auth delete data_sources" ON data_sources
  FOR DELETE
  USING (auth.role() = 'authenticated');


-- ============================================================
-- IMPORT_STAGING - Les for alle, skriv for innloggede
-- ============================================================

-- Fjern gamle offentlige policyer
DROP POLICY IF EXISTS "Public insert import_staging" ON import_staging;
DROP POLICY IF EXISTS "Public update import_staging" ON import_staging;
DROP POLICY IF EXISTS "Public delete import_staging" ON import_staging;

-- Opprett auth-baserte policyer
DROP POLICY IF EXISTS "Auth insert import_staging" ON import_staging;
CREATE POLICY "Auth insert import_staging" ON import_staging
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth update import_staging" ON import_staging;
CREATE POLICY "Auth update import_staging" ON import_staging
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth delete import_staging" ON import_staging;
CREATE POLICY "Auth delete import_staging" ON import_staging
  FOR DELETE
  USING (auth.role() = 'authenticated');


-- ============================================================
-- VERIFISERING - Vis alle policyer
-- ============================================================

SELECT
  tablename,
  policyname,
  cmd as command,
  CASE
    WHEN qual LIKE '%authenticated%' THEN 'Auth required'
    WHEN qual = 'true' THEN 'Public'
    ELSE 'Other'
  END as access_level
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
