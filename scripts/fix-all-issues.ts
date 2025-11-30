/**
 * Fiks alle avvik mellom CSV og Supabase
 * 1. Oppretter manglende kategorier
 * 2. Oppdaterer kategoritilhørighet
 * 3. Fikser requires_registration
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { parse } from 'csv-parse/sync'
import { config } from 'dotenv'

config({ path: '.env.local' })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
// Bruk service role key for å omgå RLS, fall tilbake til anon key
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Mangler miljøvariabler')
  process.exit(1)
}

console.log(`Bruker ${process.env.SUPABASE_SERVICE_KEY ? 'SERVICE ROLE' : 'ANON'} key\n`)

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Mapping fra CSV-verdier til database-verdier
const pricingMap: Record<string, string> = {
  'GRATIS': 'free',
  'GRATISH': 'freemium',
  'BETALT': 'paid'
}

// Nye kategorier som må opprettes
const newCategories = [
  { name: 'Facial Recognition', slug: 'facial-recognition', sort_order: 21 },
  { name: 'Cryptocurrency', slug: 'crypto', sort_order: 22 },
  { name: 'Satellite Imagery', slug: 'satellite-imagery', sort_order: 23 },
  { name: 'Street View', slug: 'street-view', sort_order: 24 }
]

// Mapping fra norske kategorinavn i CSV til ønsket slug
const categoryMapping: Record<string, string> = {
  'Ansiktsgjenkjenning': 'facial-recognition',
  'Arkiv og databaser': 'archiving',
  'Bilder og video': 'image-video',
  'Diverse': 'search-engines',
  'Epost': 'email',
  'Flysporing': 'transport',
  'Geolokalisering': 'geolocation',
  'Kart': 'maps-satellites',
  'Kryptovaluta': 'crypto',
  'Metadata': 'metadata',
  'Miljø og natur': 'environment',
  'Nisjesøkemotorer': 'search-engines',
  'Norske ressurser': 'public-records',
  'Personer': 'people',
  'Satellittbilder': 'satellite-imagery',
  'Selskaper og finans': 'companies-finance',
  'Skipssporing': 'transport',
  'Sosiale medier': 'social-media',
  'Street View': 'street-view',
  'Søkemotorer': 'search-engines',
  'Telefonnummer': 'phone',
  'Transport': 'transport',
  'Verifisering': 'verification',
  'Nettsider': 'domain',
  'Brukernavn': 'username',
  'Domener': 'domain',
  'AI': 'cybersecurity',
  'Konflikter': 'public-records'
}

interface CsvRow {
  Kategori: string
  Navn: string
  URL: string
  Kostnad: string
  'Krever registrering': string
}

function normalizeUrl(url: string): string {
  return url
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '')
    .trim()
}

async function main() {
  const dryRun = !process.argv.includes('--apply')

  if (dryRun) {
    console.log('*** DRY RUN - ingen endringer vil bli gjort ***')
    console.log('Kjør med --apply for å utføre endringene\n')
  }

  // Les CSV-fil
  const csvContent = readFileSync('dev_only/Sporjeger_database_gammel.csv', 'utf-8')
  const records: CsvRow[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true
  })

  console.log(`Lest ${records.length} rader fra CSV\n`)

  // ============================================
  // STEG 1: Opprett manglende kategorier
  // ============================================
  console.log('='.repeat(60))
  console.log('STEG 1: Oppretter manglende kategorier')
  console.log('='.repeat(60))

  const { data: existingCategories } = await supabase
    .from('categories')
    .select('id, name, slug')

  const existingSlugs = new Set((existingCategories || []).map(c => c.slug))
  const categoryIdBySlug = new Map<string, string>()

  for (const cat of existingCategories || []) {
    categoryIdBySlug.set(cat.slug, cat.id)
  }

  for (const newCat of newCategories) {
    if (existingSlugs.has(newCat.slug)) {
      console.log(`  [FINNES] ${newCat.name} (${newCat.slug})`)
    } else {
      console.log(`  [OPPRETTER] ${newCat.name} (${newCat.slug})`)
      if (!dryRun) {
        const { data, error } = await supabase
          .from('categories')
          .insert(newCat)
          .select('id')
          .single()

        if (error) {
          console.error(`    Feil: ${error.message}`)
        } else if (data) {
          categoryIdBySlug.set(newCat.slug, data.id)
          console.log(`    OK - ID: ${data.id}`)
        }
      }
    }
  }

  // Hent oppdatert kategoriliste
  if (!dryRun) {
    const { data: updatedCategories } = await supabase
      .from('categories')
      .select('id, name, slug')

    for (const cat of updatedCategories || []) {
      categoryIdBySlug.set(cat.slug, cat.id)
    }
  }

  // ============================================
  // STEG 2: Hent alle verktøy fra Supabase
  // ============================================
  console.log('\n' + '='.repeat(60))
  console.log('STEG 2: Henter verktøy fra Supabase')
  console.log('='.repeat(60))

  interface SupabaseTool {
    id: string
    name: string
    url: string
    pricing_model: string
    requires_registration: boolean
    category_slugs: string[]
  }

  let allTools: SupabaseTool[] = []
  let offset = 0
  const limit = 1000

  while (true) {
    const { data, error } = await supabase
      .from('tools_with_categories')
      .select('id, name, url, pricing_model, requires_registration, category_slugs')
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Feil ved henting av verktøy:', error)
      process.exit(1)
    }

    if (!data || data.length === 0) break
    allTools = allTools.concat(data as SupabaseTool[])
    offset += limit
    if (data.length < limit) break
  }

  console.log(`Hentet ${allTools.length} verktøy`)

  // Lag map basert på normalisert URL
  const supabaseByUrl = new Map<string, SupabaseTool>()
  for (const tool of allTools) {
    supabaseByUrl.set(normalizeUrl(tool.url), tool)
  }

  // Lag CSV map
  const csvByUrl = new Map<string, CsvRow>()
  for (const row of records) {
    if (row.URL && !row.URL.startsWith('Ikke')) {
      csvByUrl.set(normalizeUrl(row.URL), row)
    }
  }

  // ============================================
  // STEG 3: Finn og fiks kategoriavvik
  // ============================================
  console.log('\n' + '='.repeat(60))
  console.log('STEG 3: Fikser kategoritilhørighet')
  console.log('='.repeat(60))

  let categoryFixCount = 0

  for (const [normalizedUrl, csvRow] of csvByUrl) {
    const tool = supabaseByUrl.get(normalizedUrl)
    if (!tool) continue

    const csvCategory = csvRow.Kategori
    const expectedSlug = categoryMapping[csvCategory]

    if (!expectedSlug) continue

    // Sjekk om verktøyet allerede har riktig kategori
    if (tool.category_slugs?.includes(expectedSlug)) continue

    const categoryId = categoryIdBySlug.get(expectedSlug)
    if (!categoryId && dryRun) {
      // I dry run, anta at kategorien vil bli opprettet
      console.log(`  [KATEGORI] ${tool.name}: legger til ${expectedSlug}`)
      categoryFixCount++
      continue
    }

    if (!categoryId) {
      console.log(`  [ADVARSEL] Kategori ${expectedSlug} finnes ikke for ${tool.name}`)
      continue
    }

    console.log(`  [KATEGORI] ${tool.name}: legger til ${expectedSlug}`)
    categoryFixCount++

    if (!dryRun) {
      // Sjekk om koblingen allerede eksisterer
      const { data: existing } = await supabase
        .from('tool_categories')
        .select('tool_id')
        .eq('tool_id', tool.id)
        .eq('category_id', categoryId)
        .single()

      if (!existing) {
        const { error } = await supabase
          .from('tool_categories')
          .insert({ tool_id: tool.id, category_id: categoryId })

        if (error) {
          console.log(`    Feil: ${error.message}`)
        }
      }
    }
  }

  console.log(`\nTotalt ${categoryFixCount} kategoriendringer`)

  // ============================================
  // STEG 4: Fiks requires_registration
  // ============================================
  console.log('\n' + '='.repeat(60))
  console.log('STEG 4: Fikser requires_registration')
  console.log('='.repeat(60))

  let regFixCount = 0

  for (const [normalizedUrl, csvRow] of csvByUrl) {
    const tool = supabaseByUrl.get(normalizedUrl)
    if (!tool) continue

    const csvReg = csvRow['Krever registrering']
    let expectedReg: boolean | null = null

    if (csvReg === 'Ja') expectedReg = true
    else if (csvReg === 'Nei') expectedReg = false
    // 'Delvis' ignoreres

    if (expectedReg === null) continue
    if (tool.requires_registration === expectedReg) continue

    console.log(`  [REG] ${tool.name}: ${tool.requires_registration} -> ${expectedReg}`)
    regFixCount++

    if (!dryRun) {
      const { error } = await supabase
        .from('tools')
        .update({ requires_registration: expectedReg })
        .eq('id', tool.id)

      if (error) {
        console.log(`    Feil: ${error.message}`)
      }
    }
  }

  console.log(`\nTotalt ${regFixCount} registreringsendringer`)

  // ============================================
  // STEG 5: Fiks pricing_model
  // ============================================
  console.log('\n' + '='.repeat(60))
  console.log('STEG 5: Fikser pricing_model')
  console.log('='.repeat(60))

  let pricingFixCount = 0

  for (const [normalizedUrl, csvRow] of csvByUrl) {
    const tool = supabaseByUrl.get(normalizedUrl)
    if (!tool) continue

    const expectedPricing = pricingMap[csvRow.Kostnad]
    if (!expectedPricing) continue
    if (tool.pricing_model === expectedPricing) continue

    console.log(`  [PRIS] ${tool.name}: ${tool.pricing_model} -> ${expectedPricing}`)
    pricingFixCount++

    if (!dryRun) {
      const { error } = await supabase
        .from('tools')
        .update({ pricing_model: expectedPricing })
        .eq('id', tool.id)

      if (error) {
        console.log(`    Feil: ${error.message}`)
      }
    }
  }

  console.log(`\nTotalt ${pricingFixCount} prisendringer`)

  // ============================================
  // SAMMENDRAG
  // ============================================
  console.log('\n' + '='.repeat(60))
  console.log('SAMMENDRAG')
  console.log('='.repeat(60))
  console.log(`  Nye kategorier: ${newCategories.filter(c => !existingSlugs.has(c.slug)).length}`)
  console.log(`  Kategoriendringer: ${categoryFixCount}`)
  console.log(`  Registreringsendringer: ${regFixCount}`)
  console.log(`  Prisendringer: ${pricingFixCount}`)

  if (dryRun) {
    console.log('\n*** DRY RUN - kjør med --apply for å utføre endringene ***')
  } else {
    console.log('\nAlle endringer er utført!')
  }
}

main().catch(console.error)
