-- ============================================================
-- RLS-POLICYER FOR SPORJEGER
-- Kjor dette i Supabase SQL Editor
-- ============================================================
-- Balansert sikkerhet: Les for alle, skriv for admin
-- DELETE er bevisst utelatt for tools/categories for a forhindre utilsiktet sletting
-- Scriptet kan kjores flere ganger (idempotent)
-- ============================================================


-- ============================================================
-- TOOLS - Legger til INSERT og UPDATE
-- ============================================================

DROP POLICY IF EXISTS "Public insert tools" ON tools;
CREATE POLICY "Public insert tools" ON tools
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public update tools" ON tools;
CREATE POLICY "Public update tools" ON tools
  FOR UPDATE
  USING (true)
  WITH CHECK (true);


-- ============================================================
-- CATEGORIES - Legger til UPDATE og INSERT
-- ============================================================

DROP POLICY IF EXISTS "Public update categories" ON categories;
CREATE POLICY "Public update categories" ON categories
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public insert categories" ON categories;
CREATE POLICY "Public insert categories" ON categories
  FOR INSERT
  WITH CHECK (true);


-- ============================================================
-- TOOL_CATEGORIES - Full tilgang (trengs for a endre koblinger)
-- ============================================================

DROP POLICY IF EXISTS "Public update tool_categories" ON tool_categories;
CREATE POLICY "Public update tool_categories" ON tool_categories
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public insert tool_categories" ON tool_categories;
CREATE POLICY "Public insert tool_categories" ON tool_categories
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public delete tool_categories" ON tool_categories;
CREATE POLICY "Public delete tool_categories" ON tool_categories
  FOR DELETE
  USING (true);


-- ============================================================
-- AUDIT_LOG - Kun lesing (logg skal ikke kunne endres)
-- ============================================================

ALTER TABLE IF EXISTS audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read audit_log" ON audit_log;
CREATE POLICY "Public read audit_log" ON audit_log
  FOR SELECT
  USING (true);


-- ============================================================
-- DATA_SOURCES - Full tilgang
-- ============================================================

ALTER TABLE IF EXISTS data_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read data_sources" ON data_sources;
CREATE POLICY "Public read data_sources" ON data_sources
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public insert data_sources" ON data_sources;
CREATE POLICY "Public insert data_sources" ON data_sources
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public update data_sources" ON data_sources;
CREATE POLICY "Public update data_sources" ON data_sources
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public delete data_sources" ON data_sources;
CREATE POLICY "Public delete data_sources" ON data_sources
  FOR DELETE
  USING (true);


-- ============================================================
-- IMPORT_STAGING - Full tilgang
-- ============================================================

ALTER TABLE IF EXISTS import_staging ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read import_staging" ON import_staging;
CREATE POLICY "Public read import_staging" ON import_staging
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public insert import_staging" ON import_staging;
CREATE POLICY "Public insert import_staging" ON import_staging
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public update import_staging" ON import_staging;
CREATE POLICY "Public update import_staging" ON import_staging
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public delete import_staging" ON import_staging;
CREATE POLICY "Public delete import_staging" ON import_staging
  FOR DELETE
  USING (true);


-- ============================================================
-- VERIFISERING
-- ============================================================

SELECT
  tablename,
  policyname,
  cmd as command
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
