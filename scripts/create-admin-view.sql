-- Admin-view som viser alle verktøy med kategorier på én rad
-- Kjør dette i Supabase Dashboard > SQL Editor

DROP VIEW IF EXISTS admin_tools_view;

CREATE VIEW admin_tools_view AS
SELECT
  t.id,
  t.name AS "Navn",
  t.url AS "URL",
  t.description AS "Beskrivelse",
  CASE t.pricing_model
    WHEN 'free' THEN 'Gratis'
    WHEN 'freemium' THEN 'Gratish'
    WHEN 'paid' THEN 'Betalt'
  END AS "Pris",
  CASE
    WHEN t.requires_registration THEN 'Ja'
    ELSE 'Nei'
  END AS "Registrering",
  CASE
    WHEN t.is_active THEN 'Aktiv'
    ELSE 'Inaktiv'
  END AS "Status",
  COALESCE(
    string_agg(DISTINCT c.name, ', ' ORDER BY c.name),
    ''
  ) AS "Kategorier",
  t.tool_type AS "Type",
  t.updated_at AS "Oppdatert"
FROM tools t
LEFT JOIN tool_categories tc ON t.id = tc.tool_id
LEFT JOIN categories c ON tc.category_id = c.id
GROUP BY t.id
ORDER BY t.name;

-- Gi tilgang
GRANT SELECT ON admin_tools_view TO anon, authenticated;

-- Test viewet
SELECT * FROM admin_tools_view LIMIT 10;
