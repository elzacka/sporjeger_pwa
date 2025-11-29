-- SQL-script for å tildele OSINT-faser basert på verktøyegenskaper
-- Kjør dette i Supabase SQL Editor
--
-- OSINT Intelligence Cycle:
-- 1. Planning (Planlegging) - Rammeverk, metodikk, sjekklister
-- 2. Collection (Innsamling) - Søk, scraping, datainnhenting (flest verktøy)
-- 3. Processing (Prosessering) - Parsing, konvertering, OCR, transkribering
-- 4. Analysis (Analyse) - Visualisering, koblinger, tidslinje, statistikk
-- 5. Dissemination (Formidling) - Rapporter, presentasjoner, deling

-- ============================================================
-- NULLSTILL - Fjern alle eksisterende faser først
-- ============================================================
UPDATE tools SET intel_cycle_phases = '{}';

-- ============================================================
-- PLANNING - Rammeverk, ressurslister, guider og metodikk
-- Verktoy som hjelper med a planlegge og forberede undersokelser
-- ============================================================
UPDATE tools
SET intel_cycle_phases = array_append(intel_cycle_phases, 'planning')
WHERE name ILIKE '%framework%'
   OR name ILIKE '%methodology%'
   OR name ILIKE '%checklist%'
   OR name ILIKE '%guide%'
   OR name ILIKE '%directory%'
   OR name ILIKE '%resource%'
   OR name ILIKE '%toolkit%'
   OR name ILIKE '%collection%'
   OR name ILIKE '%suite%'
   OR name ILIKE '%list%'
   OR name ILIKE '%awesome%'
   OR name ILIKE '%curated%'
   OR name ILIKE '%handbook%'
   OR name ILIKE '%manual%'
   OR description ILIKE '%planning%'
   OR description ILIKE '%framework%'
   OR description ILIKE '%methodology%'
   OR description ILIKE '%curated list%'
   OR description ILIKE '%resource list%'
   OR description ILIKE '%collection of%'
   OR description ILIKE '%directory of%'
   OR description ILIKE '%toolkit for%'
   OR description ILIKE '%guide to%'
   OR description ILIKE '%comprehensive list%'
   OR description ILIKE '%awesome list%'
   OR description ILIKE '%reference%'
   OR description ILIKE '%resources for%';

-- ============================================================
-- COLLECTION - Søk og datainnhenting (hovedkategori)
-- ============================================================
UPDATE tools
SET intel_cycle_phases = array_append(intel_cycle_phases, 'collection')
WHERE name ILIKE '%search%'
   OR name ILIKE '%finder%'
   OR name ILIKE '%lookup%'
   OR name ILIKE '%scraper%'
   OR name ILIKE '%crawler%'
   OR name ILIKE '%monitor%'
   OR name ILIKE '%tracker%'
   OR description ILIKE '%search%'
   OR description ILIKE '%find %'
   OR description ILIKE '%discover%'
   OR description ILIKE '%collect%'
   OR description ILIKE '%gather%'
   OR description ILIKE '%scrape%'
   OR description ILIKE '%crawl%'
   OR description ILIKE '%monitor%'
   OR description ILIKE '%track%'
   OR description ILIKE '%lookup%'
   OR tool_type IN ('dork', 'database');

-- Alle søkemotorer, sosiale medier, brukernavn-verktøy er Collection
UPDATE tools t
SET intel_cycle_phases = array_append(intel_cycle_phases, 'collection')
WHERE EXISTS (
  SELECT 1 FROM tool_categories tc
  JOIN categories c ON tc.category_id = c.id
  WHERE tc.tool_id = t.id
  AND c.slug IN ('search-engines', 'social-media', 'username', 'public-records')
)
AND NOT ('collection' = ANY(intel_cycle_phases));

-- ============================================================
-- PROCESSING - Databehandling og konvertering
-- ============================================================
UPDATE tools
SET intel_cycle_phases = array_append(intel_cycle_phases, 'processing')
WHERE name ILIKE '%convert%'
   OR name ILIKE '%extract%'
   OR name ILIKE '%parser%'
   OR name ILIKE '%ocr%'
   OR name ILIKE '%transcrib%'
   OR name ILIKE '%decoder%'
   OR name ILIKE '%transform%'
   OR description ILIKE '%convert%'
   OR description ILIKE '%extract%'
   OR description ILIKE '%parse%'
   OR description ILIKE '%ocr%'
   OR description ILIKE '%transcri%'
   OR description ILIKE '%decode%'
   OR description ILIKE '%transform%'
   OR description ILIKE '%process%';

-- Metadata-verktøy er ofte Processing
UPDATE tools t
SET intel_cycle_phases = array_append(intel_cycle_phases, 'processing')
WHERE EXISTS (
  SELECT 1 FROM tool_categories tc
  JOIN categories c ON tc.category_id = c.id
  WHERE tc.tool_id = t.id
  AND c.slug = 'metadata'
)
AND NOT ('processing' = ANY(intel_cycle_phases));

-- ============================================================
-- ANALYSIS - Analyse og visualisering
-- ============================================================
UPDATE tools
SET intel_cycle_phases = array_append(intel_cycle_phases, 'analysis')
WHERE name ILIKE '%analy%'
   OR name ILIKE '%visual%'
   OR name ILIKE '%graph%'
   OR name ILIKE '%chart%'
   OR name ILIKE '%map%'
   OR name ILIKE '%timeline%'
   OR name ILIKE '%compare%'
   OR name ILIKE '%diff%'
   OR description ILIKE '%analy%'
   OR description ILIKE '%visuali%'
   OR description ILIKE '%graph%'
   OR description ILIKE '%chart%'
   OR description ILIKE '%timeline%'
   OR description ILIKE '%pattern%'
   OR description ILIKE '%connection%'
   OR description ILIKE '%relationship%'
   OR description ILIKE '%compare%';

-- Geolokalisering og kart er ofte Analysis
UPDATE tools t
SET intel_cycle_phases = array_append(intel_cycle_phases, 'analysis')
WHERE EXISTS (
  SELECT 1 FROM tool_categories tc
  JOIN categories c ON tc.category_id = c.id
  WHERE tc.tool_id = t.id
  AND c.slug IN ('geolocation', 'maps-satellites')
)
AND NOT ('analysis' = ANY(intel_cycle_phases));

-- Verification/fakta-sjekk er Analysis
UPDATE tools t
SET intel_cycle_phases = array_append(intel_cycle_phases, 'analysis')
WHERE EXISTS (
  SELECT 1 FROM tool_categories tc
  JOIN categories c ON tc.category_id = c.id
  WHERE tc.tool_id = t.id
  AND c.slug = 'verification'
)
AND NOT ('analysis' = ANY(intel_cycle_phases));

-- ============================================================
-- DISSEMINATION - Rapportering og deling
-- ============================================================
UPDATE tools
SET intel_cycle_phases = array_append(intel_cycle_phases, 'dissemination')
WHERE name ILIKE '%report%'
   OR name ILIKE '%export%'
   OR name ILIKE '%share%'
   OR name ILIKE '%present%'
   OR name ILIKE '%document%'
   OR description ILIKE '%report%'
   OR description ILIKE '%export%'
   OR description ILIKE '%share%'
   OR description ILIKE '%present%'
   OR description ILIKE '%document%'
   OR description ILIKE '%publish%';

-- Arkivering kan være Dissemination
UPDATE tools t
SET intel_cycle_phases = array_append(intel_cycle_phases, 'dissemination')
WHERE EXISTS (
  SELECT 1 FROM tool_categories tc
  JOIN categories c ON tc.category_id = c.id
  WHERE tc.tool_id = t.id
  AND c.slug = 'archiving'
)
AND NOT ('dissemination' = ANY(intel_cycle_phases));

-- ============================================================
-- FALLBACK - Verktøy uten fase får "collection" som standard
-- ============================================================
UPDATE tools
SET intel_cycle_phases = '{collection}'
WHERE intel_cycle_phases = '{}' OR intel_cycle_phases IS NULL;

-- ============================================================
-- VERIFISERING - Vis fordeling
-- ============================================================
SELECT
  phase,
  COUNT(*) as tool_count
FROM (
  SELECT unnest(intel_cycle_phases) as phase FROM tools
) phases
GROUP BY phase
ORDER BY
  CASE phase
    WHEN 'planning' THEN 1
    WHEN 'collection' THEN 2
    WHEN 'processing' THEN 3
    WHEN 'analysis' THEN 4
    WHEN 'dissemination' THEN 5
  END;

-- Vis totalt antall verktøy per kombinasjon
SELECT
  intel_cycle_phases,
  COUNT(*) as count
FROM tools
GROUP BY intel_cycle_phases
ORDER BY count DESC
LIMIT 20;
