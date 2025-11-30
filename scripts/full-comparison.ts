/**
 * Fullstendig sammenligning av CSV og Supabase
 * Finner alle avvik i: pricing, registrering, kategorier, beskrivelse, etc.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { parse } from 'csv-parse/sync'
import { config } from 'dotenv'

config({ path: '.env.local' })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Mangler miljøvariabler')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Mapping fra CSV-verdier til database-verdier
const pricingMap: Record<string, string> = {
  'GRATIS': 'free',
  'GRATISH': 'freemium',
  'BETALT': 'paid'
}

// Mapping fra norske kategorinavn til engelsk slug (basert på hva som finnes i Supabase)
const categoryMapping: Record<string, string> = {
  'Ansiktsgjenkjenning': 'facial-recognition',
  'Arkiv og databaser': 'archiving',
  'Bilder og video': 'images-video',
  'Diverse': 'misc',
  'Epost': 'email',
  'Etterretningssyklus': 'intelligence-cycle',
  'Flysporing': 'transport',
  'Geolokalisering': 'geolocation',
  'Kart': 'maps',
  'Kryptovaluta': 'crypto',
  'Metadata': 'metadata',
  'Miljø og natur': 'environment-wildlife',
  'Nisjesøkemotorer': 'search-engines',
  'Norske ressurser': 'norwegian',
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
  'Nettsider': 'websites',
  'Brukernavn': 'usernames',
  'Domener': 'domains',
  'AI': 'ai',
  'Konflikter': 'conflict'
}

interface CsvRow {
  Kategori: string
  Navn: string
  URL: string
  Beskrivelse: string
  Kostnad: string
  Språk: string
  'Krever registrering': string
  'Tool Type': string
  Platform: string
  Tags: string
  'Category Path': string
}

interface SupabaseTool {
  id: string
  name: string
  url: string
  description: string | null
  pricing_model: string
  requires_registration: boolean
  category_names: string[]
  category_slugs: string[]
}

// Normaliser URL for sammenligning
function normalizeUrl(url: string): string {
  return url
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '')
    .trim()
}

async function main() {
  // Les CSV-fil
  const csvContent = readFileSync('dev_only/Sporjeger_database_gammel.csv', 'utf-8')
  const records: CsvRow[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true
  })

  console.log(`Lest ${records.length} rader fra CSV\n`)

  // Hent kategorier fra Supabase
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug')

  console.log('Kategorier i Supabase:')
  const categoryBySlug = new Map<string, { id: string; name: string }>()
  for (const cat of categories || []) {
    console.log(`  ${cat.name} (${cat.slug})`)
    categoryBySlug.set(cat.slug, { id: cat.id, name: cat.name })
  }
  console.log('')

  // Hent ALLE verktøy fra Supabase med kategorier (med pagination)
  let allTools: SupabaseTool[] = []
  let offset = 0
  const limit = 1000

  while (true) {
    const { data, error } = await supabase
      .from('tools_with_categories')
      .select('id, name, url, description, pricing_model, requires_registration, category_names, category_slugs')
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

  const tools = allTools
  console.log(`Hentet ${tools.length} verktøy fra Supabase\n`)

  // Lag map av Supabase-verktøy basert på normalisert URL
  const supabaseByUrl = new Map<string, SupabaseTool>()
  for (const tool of (tools || []) as SupabaseTool[]) {
    supabaseByUrl.set(normalizeUrl(tool.url), tool)
  }

  // Lag map av CSV-data basert på normalisert URL
  const csvByUrl = new Map<string, CsvRow>()
  for (const row of records) {
    if (row.URL && !row.URL.startsWith('Ikke')) {
      csvByUrl.set(normalizeUrl(row.URL), row)
    }
  }

  // Finn alle avvik
  interface Discrepancy {
    name: string
    url: string
    supabaseId?: string
    issues: Array<{
      field: string
      csv: string
      supabase: string
    }>
  }

  const discrepancies: Discrepancy[] = []
  const missingInSupabase: CsvRow[] = []
  const missingInCsv: SupabaseTool[] = []

  // Sammenlign verktøy som finnes i begge
  for (const [normalizedUrl, csvRow] of csvByUrl) {
    const supabaseTool = supabaseByUrl.get(normalizedUrl)

    if (!supabaseTool) {
      missingInSupabase.push(csvRow)
      continue
    }

    const issues: Discrepancy['issues'] = []

    // Sjekk pricing_model
    const expectedPricing = pricingMap[csvRow.Kostnad]
    if (expectedPricing && supabaseTool.pricing_model !== expectedPricing) {
      issues.push({
        field: 'pricing_model',
        csv: `${csvRow.Kostnad} -> ${expectedPricing}`,
        supabase: supabaseTool.pricing_model
      })
    }

    // Sjekk requires_registration
    const csvReg = csvRow['Krever registrering']
    let expectedReg: boolean | null = null
    if (csvReg === 'Ja') expectedReg = true
    else if (csvReg === 'Nei') expectedReg = false
    // 'Delvis' betyr freemium-lignende, beholder som false

    if (expectedReg !== null && supabaseTool.requires_registration !== expectedReg) {
      issues.push({
        field: 'requires_registration',
        csv: csvReg,
        supabase: String(supabaseTool.requires_registration)
      })
    }

    // Sjekk hovedkategori
    const csvCategory = csvRow.Kategori
    const expectedSlug = categoryMapping[csvCategory]
    if (expectedSlug && !supabaseTool.category_slugs?.includes(expectedSlug)) {
      issues.push({
        field: 'category',
        csv: `${csvCategory} (${expectedSlug})`,
        supabase: supabaseTool.category_slugs?.join(', ') || '(ingen)'
      })
    }

    if (issues.length > 0) {
      discrepancies.push({
        name: supabaseTool.name,
        url: supabaseTool.url,
        supabaseId: supabaseTool.id,
        issues
      })
    }
  }

  // Sjekk verktøy som finnes i Supabase men ikke i CSV
  for (const [normalizedUrl, tool] of supabaseByUrl) {
    if (!csvByUrl.has(normalizedUrl)) {
      missingInCsv.push(tool)
    }
  }

  // Rapporter
  console.log('=' .repeat(80))
  console.log('RAPPORT: Sammenligning CSV vs Supabase')
  console.log('=' .repeat(80))

  if (discrepancies.length > 0) {
    console.log(`\n### AVVIK (${discrepancies.length} verktøy med feil):\n`)

    // Grupper etter type avvik
    const byField: Record<string, Discrepancy[]> = {}
    for (const d of discrepancies) {
      for (const issue of d.issues) {
        if (!byField[issue.field]) byField[issue.field] = []
        byField[issue.field].push(d)
      }
    }

    for (const [field, items] of Object.entries(byField)) {
      console.log(`\n--- ${field.toUpperCase()} (${items.length}) ---`)
      for (const item of items) {
        const issue = item.issues.find(i => i.field === field)
        if (issue) {
          console.log(`  ${item.name}`)
          console.log(`    CSV: ${issue.csv}`)
          console.log(`    Supabase: ${issue.supabase}`)
        }
      }
    }
  }

  if (missingInSupabase.length > 0) {
    console.log(`\n### MANGLER I SUPABASE (${missingInSupabase.length}):\n`)
    for (const row of missingInSupabase.slice(0, 20)) {
      console.log(`  ${row.Navn} (${row.URL})`)
    }
    if (missingInSupabase.length > 20) {
      console.log(`  ... og ${missingInSupabase.length - 20} til`)
    }
  }

  if (missingInCsv.length > 0) {
    console.log(`\n### KUN I SUPABASE (${missingInCsv.length} - disse er trolig lagt til manuelt):\n`)
    for (const tool of missingInCsv.slice(0, 20)) {
      console.log(`  ${tool.name} (${tool.url})`)
    }
    if (missingInCsv.length > 20) {
      console.log(`  ... og ${missingInCsv.length - 20} til`)
    }
  }

  console.log('\n' + '=' .repeat(80))
  console.log('SAMMENDRAG:')
  console.log(`  Verktøy med avvik: ${discrepancies.length}`)
  console.log(`  Mangler i Supabase: ${missingInSupabase.length}`)
  console.log(`  Kun i Supabase: ${missingInCsv.length}`)
  console.log('=' .repeat(80))
}

main().catch(console.error)
