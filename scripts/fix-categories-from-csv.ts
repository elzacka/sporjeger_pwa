/**
 * Fikser kategorier basert på CSV-fila
 * Legger til manglende kategorier uten å fjerne eksisterende
 *
 * Bruk: npx tsx scripts/fix-categories-from-csv.ts [--apply]
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { parse } from 'csv-parse/sync'
import { config } from 'dotenv'

config({ path: '.env.local' })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Mangler miljøvariabler')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const dryRun = !process.argv.includes('--apply')

function normalizeUrl(url: string): string {
  return url
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '')
    .trim()
}

// Mapping fra CSV-kategori til Supabase slug(s)
const categoryMap: Record<string, string[]> = {
  'Sosiale medier og kommunikasjon': ['social-media'],
  'Søkemotorer': ['search-engines'],
  'Brukernavn, e-postadresser og annet': ['username'],
  'Domener': ['domain'],
  'IP-adresser': ['ip-address'],
  'Bilder og video': ['image-video'],
  'Kart': ['maps-satellites'],
  'Transport og ruter': ['transport'],
  'Bedrifter og økonomi': ['companies-finance'],
  'Arkiv og databaser': ['archiving'],
  'Telefonnumre': ['phone'],
  'Metadata': ['metadata'],
  'Det mørke nettet': ['dark-web'],
  'Cybersikkerhet': ['cybersecurity'],
  'Miljø og vilt': ['environment'],
  'Personsøk': ['people'],
  'Geolokalisering': ['geolocation'],
  'Verifisering': ['verification']
}

// Mapping fra Category Path til ekstra kategorier
const categoryPathMap: Record<string, string> = {
  'Søkemotorer, Arkiv': 'archive',
  'Ansiktsgjenkjenning': 'facial-recognition',
  'Krypto': 'crypto',
  'Satellittbilder': 'satellite-imagery',
  'Gatebilder': 'street-view'
}

interface CsvRow {
  Kategori: string
  Navn: string
  URL: string
  'Category Path': string
}

async function main() {
  if (dryRun) {
    console.log('*** DRY RUN - ingen endringer vil bli gjort ***')
    console.log('Kjør med --apply for å utføre endringene\n')
  }

  // Les CSV
  const csvContent = readFileSync('dev_only/Sporjeger_database_gammel.csv', 'utf-8')
  const records: CsvRow[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true
  })

  console.log(`Hentet ${records.length} rader fra CSV\n`)

  // Hent kategorier fra Supabase
  const { data: categories } = await supabase
    .from('categories')
    .select('id, slug')

  const categoryBySlug = new Map<string, string>()
  for (const cat of categories || []) {
    categoryBySlug.set(cat.slug, cat.id)
  }

  console.log(`Kategorier i Supabase: ${categories?.length}`)
  for (const [slug] of categoryBySlug) {
    console.log(`  - ${slug}`)
  }

  // Hent verktøy fra Supabase
  let allTools: any[] = []
  let offset = 0
  while (true) {
    const { data } = await supabase
      .from('tools_with_categories')
      .select('id, name, url, category_slugs')
      .eq('is_active', true)
      .range(offset, offset + 999)
    if (!data || data.length === 0) break
    allTools = allTools.concat(data)
    offset += 1000
    if (data.length < 1000) break
  }

  const toolsByUrl = new Map<string, any>()
  for (const tool of allTools) {
    toolsByUrl.set(normalizeUrl(tool.url), tool)
  }

  console.log(`\nHentet ${allTools.length} aktive verktøy fra Supabase\n`)

  // Finn og fiks manglende kategorier
  const toAdd: { toolId: string; toolName: string; categorySlug: string }[] = []

  for (const csvRow of records) {
    if (!csvRow.URL || csvRow.URL.startsWith('Ikke')) continue

    const tool = toolsByUrl.get(normalizeUrl(csvRow.URL))
    if (!tool) continue

    const toolSlugs = tool.category_slugs || []

    // Sjekk hovedkategori
    const expectedSlugs = categoryMap[csvRow.Kategori] || []
    for (const slug of expectedSlugs) {
      if (!toolSlugs.includes(slug) && categoryBySlug.has(slug)) {
        toAdd.push({ toolId: tool.id, toolName: tool.name, categorySlug: slug })
      }
    }

    // Sjekk Category Path for ekstra kategorier
    const categoryPath = csvRow['Category Path'] || ''
    for (const [pathPart, slug] of Object.entries(categoryPathMap)) {
      if (categoryPath.includes(pathPart) && !toolSlugs.includes(slug) && categoryBySlug.has(slug)) {
        toAdd.push({ toolId: tool.id, toolName: tool.name, categorySlug: slug })
      }
    }
  }

  // Fjern duplikater
  const uniqueToAdd = toAdd.filter((item, index, self) =>
    index === self.findIndex(t => t.toolId === item.toolId && t.categorySlug === item.categorySlug)
  )

  console.log('='.repeat(60))
  console.log(`KATEGORIER SOM VIL LEGGES TIL: ${uniqueToAdd.length}`)
  console.log('='.repeat(60))

  // Grupper etter kategori for oversikt
  const byCategory = new Map<string, string[]>()
  for (const item of uniqueToAdd) {
    if (!byCategory.has(item.categorySlug)) {
      byCategory.set(item.categorySlug, [])
    }
    byCategory.get(item.categorySlug)!.push(item.toolName)
  }

  for (const [slug, tools] of byCategory) {
    console.log(`\n${slug}: ${tools.length} verktøy`)
    for (const name of tools.slice(0, 5)) {
      console.log(`  - ${name}`)
    }
    if (tools.length > 5) {
      console.log(`  ... og ${tools.length - 5} til`)
    }
  }

  if (!dryRun && uniqueToAdd.length > 0) {
    console.log('\n' + '='.repeat(60))
    console.log('LEGGER TIL KATEGORIER...')
    console.log('='.repeat(60))

    let successCount = 0
    let errorCount = 0

    for (const item of uniqueToAdd) {
      const categoryId = categoryBySlug.get(item.categorySlug)
      if (!categoryId) continue

      const { error } = await supabase
        .from('tool_categories')
        .upsert(
          { tool_id: item.toolId, category_id: categoryId },
          { onConflict: 'tool_id,category_id' }
        )

      if (error) {
        console.log(`  [FEIL] ${item.toolName} -> ${item.categorySlug}: ${error.message}`)
        errorCount++
      } else {
        successCount++
      }
    }

    console.log(`\nFullført: ${successCount} lagt til, ${errorCount} feil`)
  }

  if (dryRun) {
    console.log('\nKjør med --apply for å utføre endringene')
  }
}

main().catch(console.error)
