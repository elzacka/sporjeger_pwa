-- SQL for å fikse kategorier i Supabase
-- Kjør dette i Supabase Dashboard > SQL Editor

-- ============================================
-- STEG 1: Opprett manglende kategorier
-- ============================================

INSERT INTO categories (name, slug, sort_order) VALUES
  ('Facial Recognition', 'facial-recognition', 21),
  ('Cryptocurrency', 'crypto', 22),
  ('Satellite Imagery', 'satellite-imagery', 23),
  ('Street View', 'street-view', 24)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- STEG 2: Legg til kategoritilhørighet
-- ============================================

-- Ansiktsgjenkjenning -> facial-recognition
INSERT INTO tool_categories (tool_id, category_id)
SELECT t.id, c.id
FROM tools t, categories c
WHERE c.slug = 'facial-recognition'
AND t.url IN (
  'https://aws.amazon.com/rekognition/',
  'https://vi.microsoft.com/en-us',
  'https://facecomparison.toolpie.com/',
  'https://facecheck.id/',
  'https://pimeyes.com/en',
  'https://search4faces.com'
)
ON CONFLICT DO NOTHING;

-- Arkiv og databaser -> archiving
INSERT INTO tool_categories (tool_id, category_id)
SELECT t.id, c.id
FROM tools t, categories c
WHERE c.slug = 'archiving'
AND t.url IN (
  'https://www.arkivportalen.no/',
  'https://digitaltmuseum.no/',
  'https://www.judyrecords.com/',
  'https://lumendatabase.org/',
  'https://www.nb.no/search',
  'https://osmp.ngo/',
  'https://clean.calmatters.org/',
  'https://www.thelawpages.com/court-cases/court-case-search.php?mode=1',
  'https://web.archive.org/',
  'https://apps.apple.com/us/app/web-archives-for-safari/id1603181853?platform=mac',
  'http://wikiroutes.info/',
  'https://cipher387.github.io/osintmap/'
)
ON CONFLICT DO NOTHING;

-- Kart -> maps-satellites
INSERT INTO tool_categories (tool_id, category_id)
SELECT t.id, c.id
FROM tools t, categories c
WHERE c.slug = 'maps-satellites'
AND t.url IN (
  'https://www.alltrails.com/',
  'https://www.amazoniasocioambiental.org/en/',
  'https://www.wri.org/applications/aqueduct/water-risk-atlas/',
  'https://ejatlas.org/',
  'http://topotijdreis.nl',
  'https://ut.no/trakke'
)
ON CONFLICT DO NOTHING;

-- Kryptovaluta -> crypto
INSERT INTO tool_categories (tool_id, category_id)
SELECT t.id, c.id
FROM tools t, categories c
WHERE c.slug = 'crypto'
AND t.url IN (
  'http://bitcoinwhoswho.com/',
  'http://bitref.com/',
  'http://blockchain.info/',
  'http://blockonomics.co/',
  'http://blockr.io/',
  'http://blocktrail.com/',
  'http://chainradar.com/',
  'http://live.ether.camp/',
  'http://etherchain.org/',
  'http://graphsense.info/',
  'http://moneroblocks.info/',
  'http://oxt.me/',
  'http://walletexplorer.com/',
  'http://xmrchain.net/'
)
ON CONFLICT DO NOTHING;

-- Satellittbilder -> satellite-imagery
INSERT INTO tool_categories (tool_id, category_id)
SELECT t.id, c.id
FROM tools t, categories c
WHERE c.slug = 'satellite-imagery'
AND t.url IN (
  'https://apollomapping.com/',
  'https://atmosphere.copernicus.eu/',
  'https://browser.dataspace.copernicus.eu/',
  'https://earthexplorer.usgs.gov/',
  'http://eos.com/landviewer',
  'https://code.earthengine.google.com/',
  'https://www.google.com/earth/about/versions/',
  'https://wego.here.com/',
  'https://www.indexdatabase.de/',
  'http://en.mappy.com/',
  'https://worldview.earthdata.nasa.gov/',
  'https://www.planet.com/',
  'https://www.qgis.org',
  'https://ollielballinger.users.earthengine.app/view/bellingcat-radar-interference-tracker#lon=49.9507;lat=26.6056;zoom=4;',
  'https://rammb-slider.cira.colostate.edu/',
  'https://satellitetracker3d.com/',
  'https://skyfi.com/',
  'https://soar.earth/?pos=-24.806025673047216%2C112.37019712776902%2C7',
  'https://earth.esa.int/eogateway/tools',
  'https://umbra.space/'
)
ON CONFLICT DO NOTHING;

-- Street View -> street-view
INSERT INTO tool_categories (tool_id, category_id)
SELECT t.id, c.id
FROM tools t, categories c
WHERE c.slug = 'street-view'
AND t.url IN (
  'https://kartaview.org/map',
  'https://wikimapia.org/'
)
ON CONFLICT DO NOTHING;

-- Telefonnummer -> phone
INSERT INTO tool_categories (tool_id, category_id)
SELECT t.id, c.id
FROM tools t, categories c
WHERE c.slug = 'phone'
AND t.url IN (
  'http://411.com/',
  'http://data24-7.com/',
  'http://www.fonefinder.net/',
  'http://freecarrierlookup.com/',
  'http://www.hlr-lookups.com/',
  'http://mrnumber.com/',
  'http://www.numberingplans.com/',
  'https://sur.ly/o/numberway.com/AA000014',
  'http://numspy-api.com/',
  'http://www.opencnam.com/',
  'http://www.opencnam.com/api',
  'http://reversegenie.com/',
  'http://slydial.com/',
  'http://spydialer.com/',
  'http://www.twilio.com/lookup',
  'http://whocalld.com/'
)
ON CONFLICT DO NOTHING;

-- Transport (verktøy som mangler kategori)
INSERT INTO tool_categories (tool_id, category_id)
SELECT t.id, c.id
FROM tools t, categories c
WHERE c.slug = 'transport'
AND t.url IN (
  'http://ads-b.nl/',
  'http://data.deutschebahn.com/',
  'http://autocheck.com/',
  'http://reversegenie.com/license_plates.php',
  'http://n2yo.com/',
  'http://track-trace.com/',
  'http://tracker.geops.ch/',
  'http://vehicleregistrationusa.com/',
  'http://vehicle-find.com/',
  'http://vindecoderz.com/',
  'http://vincheck.info/',
  'http://www.world-aeronautical-database.com/'
)
ON CONFLICT DO NOTHING;

-- ============================================
-- Verifiser endringer
-- ============================================
SELECT
  c.name as category,
  COUNT(tc.tool_id) as tool_count
FROM categories c
LEFT JOIN tool_categories tc ON c.id = tc.category_id
GROUP BY c.id, c.name
ORDER BY c.name;
