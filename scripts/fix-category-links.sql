-- SQL-script for å opprette manglende tool_categories-koblinger
-- Kjor dette i Supabase SQL Editor
--
-- VIKTIG: Kjor SELECT-sporringene forst for a se hva som vil bli lagt til,
-- deretter kjor INSERT-sporringene

-- ============================================================
-- 1. EMAIL-KATEGORI
-- ============================================================
-- Forhandsvisning:
SELECT t.name, 'email' as category
FROM tools t
WHERE (t.name ILIKE '%email%' OR t.description ILIKE '%email%' OR t.description ILIKE '%e-mail%')
  AND NOT EXISTS (
    SELECT 1 FROM tool_categories tc
    WHERE tc.tool_id = t.id AND tc.category_id = 'c7b8758a-ba6d-4f31-b5a6-093cae4b4638'
  )
LIMIT 20;

-- Innsetting:
INSERT INTO tool_categories (tool_id, category_id)
SELECT t.id, 'c7b8758a-ba6d-4f31-b5a6-093cae4b4638'
FROM tools t
WHERE (t.name ILIKE '%email%' OR t.description ILIKE '%email%' OR t.description ILIKE '%e-mail%')
  AND NOT EXISTS (
    SELECT 1 FROM tool_categories tc
    WHERE tc.tool_id = t.id AND tc.category_id = 'c7b8758a-ba6d-4f31-b5a6-093cae4b4638'
  );

-- ============================================================
-- 2. DOMAIN-KATEGORI
-- ============================================================
-- Forhandsvisning:
SELECT t.name, 'domain' as category
FROM tools t
WHERE (t.name ILIKE '%domain%' OR t.description ILIKE '%domain%' OR t.name ILIKE '%dns%' OR t.description ILIKE '%dns%' OR t.name ILIKE '%whois%' OR t.description ILIKE '%whois%')
  AND NOT EXISTS (
    SELECT 1 FROM tool_categories tc
    WHERE tc.tool_id = t.id AND tc.category_id = '63bd9bb3-ef94-4991-a5e9-5301732c8d21'
  )
LIMIT 20;

-- Innsetting:
INSERT INTO tool_categories (tool_id, category_id)
SELECT t.id, '63bd9bb3-ef94-4991-a5e9-5301732c8d21'
FROM tools t
WHERE (t.name ILIKE '%domain%' OR t.description ILIKE '%domain%' OR t.name ILIKE '%dns%' OR t.description ILIKE '%dns%' OR t.name ILIKE '%whois%' OR t.description ILIKE '%whois%')
  AND NOT EXISTS (
    SELECT 1 FROM tool_categories tc
    WHERE tc.tool_id = t.id AND tc.category_id = '63bd9bb3-ef94-4991-a5e9-5301732c8d21'
  );

-- ============================================================
-- 3. IP-ADDRESS-KATEGORI
-- ============================================================
-- Forhandsvisning:
SELECT t.name, 'ip-address' as category
FROM tools t
WHERE (t.name ILIKE '% ip %' OR t.name ILIKE '%ip address%' OR t.name ILIKE '%ip-address%'
       OR t.description ILIKE '% ip %' OR t.description ILIKE '%ip address%'
       OR t.name ILIKE '%ipv4%' OR t.name ILIKE '%ipv6%'
       OR t.description ILIKE '%ip lookup%' OR t.description ILIKE '%ip geolocation%')
  AND NOT EXISTS (
    SELECT 1 FROM tool_categories tc
    WHERE tc.tool_id = t.id AND tc.category_id = '4abbd102-1031-4a91-9155-d7c8c37576d0'
  )
LIMIT 20;

-- Innsetting:
INSERT INTO tool_categories (tool_id, category_id)
SELECT t.id, '4abbd102-1031-4a91-9155-d7c8c37576d0'
FROM tools t
WHERE (t.name ILIKE '% ip %' OR t.name ILIKE '%ip address%' OR t.name ILIKE '%ip-address%'
       OR t.description ILIKE '% ip %' OR t.description ILIKE '%ip address%'
       OR t.name ILIKE '%ipv4%' OR t.name ILIKE '%ipv6%'
       OR t.description ILIKE '%ip lookup%' OR t.description ILIKE '%ip geolocation%')
  AND NOT EXISTS (
    SELECT 1 FROM tool_categories tc
    WHERE tc.tool_id = t.id AND tc.category_id = '4abbd102-1031-4a91-9155-d7c8c37576d0'
  );

-- ============================================================
-- 4. PHONE-KATEGORI
-- ============================================================
-- Forhandsvisning:
SELECT t.name, 'phone' as category
FROM tools t
WHERE (t.name ILIKE '%phone%' OR t.description ILIKE '%phone number%'
       OR t.name ILIKE '%telephone%' OR t.description ILIKE '%telephone%'
       OR t.name ILIKE '%caller%' OR t.description ILIKE '%caller id%')
  AND NOT EXISTS (
    SELECT 1 FROM tool_categories tc
    WHERE tc.tool_id = t.id AND tc.category_id = '48b17c5f-5ccb-44fe-8d33-d55f8a3484dc'
  )
LIMIT 20;

-- Innsetting:
INSERT INTO tool_categories (tool_id, category_id)
SELECT t.id, '48b17c5f-5ccb-44fe-8d33-d55f8a3484dc'
FROM tools t
WHERE (t.name ILIKE '%phone%' OR t.description ILIKE '%phone number%'
       OR t.name ILIKE '%telephone%' OR t.description ILIKE '%telephone%'
       OR t.name ILIKE '%caller%' OR t.description ILIKE '%caller id%')
  AND NOT EXISTS (
    SELECT 1 FROM tool_categories tc
    WHERE tc.tool_id = t.id AND tc.category_id = '48b17c5f-5ccb-44fe-8d33-d55f8a3484dc'
  );

-- ============================================================
-- 5. DARK-WEB-KATEGORI
-- ============================================================
-- Forhandsvisning:
SELECT t.name, 'dark-web' as category
FROM tools t
WHERE (t.name ILIKE '%dark web%' OR t.description ILIKE '%dark web%'
       OR t.name ILIKE '%darknet%' OR t.description ILIKE '%darknet%'
       OR t.name ILIKE '%onion%' OR t.description ILIKE '%onion%'
       OR t.name ILIKE '%.onion%' OR t.description ILIKE '%.onion%')
  AND NOT EXISTS (
    SELECT 1 FROM tool_categories tc
    WHERE tc.tool_id = t.id AND tc.category_id = '64d895bd-85eb-4e14-b477-abfbb52fcbc5'
  )
LIMIT 20;

-- Innsetting:
INSERT INTO tool_categories (tool_id, category_id)
SELECT t.id, '64d895bd-85eb-4e14-b477-abfbb52fcbc5'
FROM tools t
WHERE (t.name ILIKE '%dark web%' OR t.description ILIKE '%dark web%'
       OR t.name ILIKE '%darknet%' OR t.description ILIKE '%darknet%'
       OR t.name ILIKE '%onion%' OR t.description ILIKE '%onion%'
       OR t.name ILIKE '%.onion%' OR t.description ILIKE '%.onion%')
  AND NOT EXISTS (
    SELECT 1 FROM tool_categories tc
    WHERE tc.tool_id = t.id AND tc.category_id = '64d895bd-85eb-4e14-b477-abfbb52fcbc5'
  );

-- ============================================================
-- 6. CYBERSECURITY-KATEGORI
-- ============================================================
-- Forhandsvisning:
SELECT t.name, 'cybersecurity' as category
FROM tools t
WHERE (t.name ILIKE '%cyber%' OR t.description ILIKE '%cybersecurity%'
       OR t.name ILIKE '%malware%' OR t.description ILIKE '%malware%'
       OR t.name ILIKE '%threat%' OR t.description ILIKE '%threat intelligence%'
       OR t.name ILIKE '%vulnerability%' OR t.description ILIKE '%vulnerability%'
       OR t.name ILIKE '%exploit%' OR t.description ILIKE '%exploit%')
  AND NOT EXISTS (
    SELECT 1 FROM tool_categories tc
    WHERE tc.tool_id = t.id AND tc.category_id = 'f92feafa-52ee-4699-bfd1-08b0327a54e7'
  )
LIMIT 20;

-- Innsetting:
INSERT INTO tool_categories (tool_id, category_id)
SELECT t.id, 'f92feafa-52ee-4699-bfd1-08b0327a54e7'
FROM tools t
WHERE (t.name ILIKE '%cyber%' OR t.description ILIKE '%cybersecurity%'
       OR t.name ILIKE '%malware%' OR t.description ILIKE '%malware%'
       OR t.name ILIKE '%threat%' OR t.description ILIKE '%threat intelligence%'
       OR t.name ILIKE '%vulnerability%' OR t.description ILIKE '%vulnerability%'
       OR t.name ILIKE '%exploit%' OR t.description ILIKE '%exploit%')
  AND NOT EXISTS (
    SELECT 1 FROM tool_categories tc
    WHERE tc.tool_id = t.id AND tc.category_id = 'f92feafa-52ee-4699-bfd1-08b0327a54e7'
  );

-- ============================================================
-- 7. PEOPLE-SEARCH-KATEGORI
-- ============================================================
-- Forhandsvisning:
SELECT t.name, 'people' as category
FROM tools t
WHERE (t.name ILIKE '%people search%' OR t.description ILIKE '%people search%'
       OR t.name ILIKE '%person finder%' OR t.description ILIKE '%find people%'
       OR t.name ILIKE '%person lookup%' OR t.description ILIKE '%person lookup%'
       OR t.name ILIKE '%background check%' OR t.description ILIKE '%background check%')
  AND NOT EXISTS (
    SELECT 1 FROM tool_categories tc
    WHERE tc.tool_id = t.id AND tc.category_id = '17c19c50-3837-4473-ab04-355d1319caf2'
  )
LIMIT 20;

-- Innsetting:
INSERT INTO tool_categories (tool_id, category_id)
SELECT t.id, '17c19c50-3837-4473-ab04-355d1319caf2'
FROM tools t
WHERE (t.name ILIKE '%people search%' OR t.description ILIKE '%people search%'
       OR t.name ILIKE '%person finder%' OR t.description ILIKE '%find people%'
       OR t.name ILIKE '%person lookup%' OR t.description ILIKE '%person lookup%'
       OR t.name ILIKE '%background check%' OR t.description ILIKE '%background check%')
  AND NOT EXISTS (
    SELECT 1 FROM tool_categories tc
    WHERE tc.tool_id = t.id AND tc.category_id = '17c19c50-3837-4473-ab04-355d1319caf2'
  );

-- ============================================================
-- 8. MAPS-SATELLITES-KATEGORI
-- ============================================================
-- Forhandsvisning:
SELECT t.name, 'maps-satellites' as category
FROM tools t
WHERE (t.name ILIKE '%satellite%' OR t.description ILIKE '%satellite%'
       OR t.name ILIKE '%map%' OR t.description ILIKE '%mapping%'
       OR t.name ILIKE '%aerial%' OR t.description ILIKE '%aerial%'
       OR t.name ILIKE '%earth%' OR t.description ILIKE '%google earth%')
  AND NOT EXISTS (
    SELECT 1 FROM tool_categories tc
    WHERE tc.tool_id = t.id AND tc.category_id = '5162940f-9f00-45f0-986d-fdd25096c8dc'
  )
LIMIT 20;

-- Innsetting:
INSERT INTO tool_categories (tool_id, category_id)
SELECT t.id, '5162940f-9f00-45f0-986d-fdd25096c8dc'
FROM tools t
WHERE (t.name ILIKE '%satellite%' OR t.description ILIKE '%satellite%'
       OR t.name ILIKE '%map%' OR t.description ILIKE '%mapping%'
       OR t.name ILIKE '%aerial%' OR t.description ILIKE '%aerial%'
       OR t.name ILIKE '%earth%' OR t.description ILIKE '%google earth%')
  AND NOT EXISTS (
    SELECT 1 FROM tool_categories tc
    WHERE tc.tool_id = t.id AND tc.category_id = '5162940f-9f00-45f0-986d-fdd25096c8dc'
  );

-- ============================================================
-- 9. TRANSPORT-KATEGORI
-- ============================================================
-- Forhandsvisning:
SELECT t.name, 'transport' as category
FROM tools t
WHERE (t.name ILIKE '%flight%' OR t.description ILIKE '%flight%'
       OR t.name ILIKE '%aircraft%' OR t.description ILIKE '%aircraft%'
       OR t.name ILIKE '%ship%' OR t.description ILIKE '%ship tracking%'
       OR t.name ILIKE '%vessel%' OR t.description ILIKE '%vessel%'
       OR t.name ILIKE '%marine%' OR t.description ILIKE '%marine%'
       OR t.name ILIKE '%ais%' OR t.description ILIKE '%ais%'
       OR t.name ILIKE '%train%' OR t.description ILIKE '%railway%')
  AND NOT EXISTS (
    SELECT 1 FROM tool_categories tc
    WHERE tc.tool_id = t.id AND tc.category_id = 'b423bdc7-e86f-4958-a5a8-087f538e2b0f'
  )
LIMIT 20;

-- Innsetting:
INSERT INTO tool_categories (tool_id, category_id)
SELECT t.id, 'b423bdc7-e86f-4958-a5a8-087f538e2b0f'
FROM tools t
WHERE (t.name ILIKE '%flight%' OR t.description ILIKE '%flight%'
       OR t.name ILIKE '%aircraft%' OR t.description ILIKE '%aircraft%'
       OR t.name ILIKE '%ship%' OR t.description ILIKE '%ship tracking%'
       OR t.name ILIKE '%vessel%' OR t.description ILIKE '%vessel%'
       OR t.name ILIKE '%marine%' OR t.description ILIKE '%marine%'
       OR t.name ILIKE '%ais%' OR t.description ILIKE '%ais%'
       OR t.name ILIKE '%train%' OR t.description ILIKE '%railway%')
  AND NOT EXISTS (
    SELECT 1 FROM tool_categories tc
    WHERE tc.tool_id = t.id AND tc.category_id = 'b423bdc7-e86f-4958-a5a8-087f538e2b0f'
  );

-- ============================================================
-- 10. VERIFICATION-KATEGORI
-- ============================================================
-- Forhandsvisning:
SELECT t.name, 'verification' as category
FROM tools t
WHERE (t.name ILIKE '%verif%' OR t.description ILIKE '%verification%'
       OR t.name ILIKE '%fact check%' OR t.description ILIKE '%fact check%'
       OR t.name ILIKE '%debunk%' OR t.description ILIKE '%debunk%'
       OR t.name ILIKE '%fake%' OR t.description ILIKE '%detect fake%')
  AND NOT EXISTS (
    SELECT 1 FROM tool_categories tc
    WHERE tc.tool_id = t.id AND tc.category_id = 'be69dd5b-4299-4f44-b127-04f8cc4b8a70'
  )
LIMIT 20;

-- Innsetting:
INSERT INTO tool_categories (tool_id, category_id)
SELECT t.id, 'be69dd5b-4299-4f44-b127-04f8cc4b8a70'
FROM tools t
WHERE (t.name ILIKE '%verif%' OR t.description ILIKE '%verification%'
       OR t.name ILIKE '%fact check%' OR t.description ILIKE '%fact check%'
       OR t.name ILIKE '%debunk%' OR t.description ILIKE '%debunk%'
       OR t.name ILIKE '%fake%' OR t.description ILIKE '%detect fake%')
  AND NOT EXISTS (
    SELECT 1 FROM tool_categories tc
    WHERE tc.tool_id = t.id AND tc.category_id = 'be69dd5b-4299-4f44-b127-04f8cc4b8a70'
  );

-- ============================================================
-- 11. ENVIRONMENT-KATEGORI
-- ============================================================
-- Forhandsvisning:
SELECT t.name, 'environment' as category
FROM tools t
WHERE (t.name ILIKE '%environment%' OR t.description ILIKE '%environmental%'
       OR t.name ILIKE '%wildlife%' OR t.description ILIKE '%wildlife%'
       OR t.name ILIKE '%climate%' OR t.description ILIKE '%climate%'
       OR t.name ILIKE '%weather%' OR t.description ILIKE '%weather%')
  AND NOT EXISTS (
    SELECT 1 FROM tool_categories tc
    WHERE tc.tool_id = t.id AND tc.category_id = 'c57fbf49-b3ee-498c-a75d-915a5d16a4dc'
  )
LIMIT 20;

-- Innsetting:
INSERT INTO tool_categories (tool_id, category_id)
SELECT t.id, 'c57fbf49-b3ee-498c-a75d-915a5d16a4dc'
FROM tools t
WHERE (t.name ILIKE '%environment%' OR t.description ILIKE '%environmental%'
       OR t.name ILIKE '%wildlife%' OR t.description ILIKE '%wildlife%'
       OR t.name ILIKE '%climate%' OR t.description ILIKE '%climate%'
       OR t.name ILIKE '%weather%' OR t.description ILIKE '%weather%')
  AND NOT EXISTS (
    SELECT 1 FROM tool_categories tc
    WHERE tc.tool_id = t.id AND tc.category_id = 'c57fbf49-b3ee-498c-a75d-915a5d16a4dc'
  );

-- ============================================================
-- VERIFISERING - Kjor denne ETTER alle INSERT-sporringer
-- ============================================================
SELECT c.name, COUNT(tc.tool_id) as tool_count
FROM categories c
LEFT JOIN tool_categories tc ON tc.category_id = c.id
GROUP BY c.id, c.name
ORDER BY tool_count DESC;
