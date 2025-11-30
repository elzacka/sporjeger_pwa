/**
 * Synkroniser Supabase-data med verdier fra den gamle CSV-filen
 *
 * Bruk: npx tsx scripts/sync-from-csv.ts
 *
 * Matcher verktøy basert på URL og oppdaterer:
 * - pricing_model (GRATIS -> free, GRATISH -> freemium, BETALT -> paid)
 * - requires_registration (Ja -> true, Nei -> false)
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { parse } from 'csv-parse/sync'

// Supabase-konfigurasjon
// Les fra .env.local
import { config } from 'dotenv'
config({ path: '.env.local' })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || ''
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Mangler VITE_SUPABASE_URL eller VITE_SUPABASE_ANON_KEY i .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Mapping fra CSV-verdier til database-verdier
const pricingMap: Record<string, string> = {
  'GRATIS': 'free',
  'GRATISH': 'freemium',
  'BETALT': 'paid'
}

interface CsvRow {
  Kategori: string
  Navn: string
  URL: string
  Beskrivelse: string
  Kostnad: string
  'Krever registrering': string
}

async function main() {
  // Les CSV-fil
  const csvContent = readFileSync('dev_only/Sporjeger_database_gammel.csv', 'utf-8')
  const records: CsvRow[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true
  })

  console.log(`Lest ${records.length} rader fra CSV`)

  // Hent alle verktøy fra Supabase
  const { data: tools, error } = await supabase
    .from('tools')
    .select('id, name, url, pricing_model, requires_registration')

  if (error) {
    console.error('Feil ved henting av verktøy:', error)
    process.exit(1)
  }

  console.log(`Hentet ${tools?.length || 0} verktøy fra Supabase`)

  // Normaliser URL for sammenligning
  const normalizeUrl = (url: string): string => {
    return url
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '')
  }

  // Lag en map av CSV-data basert på normalisert URL
  const csvByUrl = new Map<string, CsvRow>()
  for (const row of records) {
    if (row.URL) {
      csvByUrl.set(normalizeUrl(row.URL), row)
    }
  }

  // Sammenlign og finn avvik
  const updates: Array<{
    id: string
    name: string
    url: string
    changes: Record<string, { from: unknown; to: unknown }>
  }> = []

  for (const tool of tools || []) {
    const normalizedUrl = normalizeUrl(tool.url)
    const csvRow = csvByUrl.get(normalizedUrl)

    if (!csvRow) continue

    const changes: Record<string, { from: unknown; to: unknown }> = {}

    // Sjekk pricing_model
    const expectedPricing = pricingMap[csvRow.Kostnad]
    if (expectedPricing && tool.pricing_model !== expectedPricing) {
      changes.pricing_model = { from: tool.pricing_model, to: expectedPricing }
    }

    // Sjekk requires_registration
    const expectedReg = csvRow['Krever registrering'] === 'Ja'
    if (tool.requires_registration !== expectedReg) {
      changes.requires_registration = { from: tool.requires_registration, to: expectedReg }
    }

    if (Object.keys(changes).length > 0) {
      updates.push({ id: tool.id, name: tool.name, url: tool.url, changes })
    }
  }

  if (updates.length === 0) {
    console.log('\nIngen avvik funnet! Alle verdier matcher.')
    return
  }

  console.log(`\nFant ${updates.length} verktøy med avvik:\n`)

  for (const update of updates) {
    console.log(`${update.name} (${update.url})`)
    for (const [field, { from, to }] of Object.entries(update.changes)) {
      console.log(`  ${field}: ${from} -> ${to}`)
    }
  }

  // Spør om oppdatering (hvis ikke --apply flagg)
  if (process.argv.includes('--apply')) {
    console.log('\nOppdaterer Supabase...\n')

    for (const update of updates) {
      const updateData: Record<string, unknown> = {}
      for (const [field, { to }] of Object.entries(update.changes)) {
        updateData[field] = to
      }

      const { error: updateError } = await supabase
        .from('tools')
        .update(updateData)
        .eq('id', update.id)

      if (updateError) {
        console.error(`Feil ved oppdatering av ${update.name}:`, updateError)
      } else {
        console.log(`Oppdatert: ${update.name}`)
      }
    }

    console.log('\nFerdig!')
  } else {
    console.log('\nKjør med --apply for å oppdatere Supabase')
  }
}

main().catch(console.error)
