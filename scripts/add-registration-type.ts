/**
 * Legger til registration_type felt og migrerer data
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

interface CsvRow {
  Navn: string
  URL: string
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

  // Finn alle med "Delvis"
  const partialTools = records.filter(r => r['Krever registrering'] === 'Delvis')

  console.log(`Fant ${partialTools.length} verktøy med "Delvis" registrering:\n`)

  for (const tool of partialTools) {
    console.log(`  ${tool.Navn} (${tool.URL})`)
  }

  // Hent verktøy fra Supabase
  const { data: tools, error } = await supabase
    .from('tools')
    .select('id, name, url, requires_registration')

  if (error) {
    console.error('Feil ved henting av verktøy:', error)
    process.exit(1)
  }

  // Lag map basert på normalisert URL
  const toolsByUrl = new Map<string, { id: string; name: string }>()
  for (const tool of tools || []) {
    toolsByUrl.set(normalizeUrl(tool.url), { id: tool.id, name: tool.name })
  }

  console.log('\n' + '='.repeat(60))
  console.log('OPPDATERINGER')
  console.log('='.repeat(60))

  // For hvert "Delvis"-verktøy, sett requires_registration = false
  // (Vi bruker freemium-badge i stedet for en egen "Delvis"-badge)
  let updateCount = 0

  for (const csvTool of partialTools) {
    if (!csvTool.URL || csvTool.URL.startsWith('Ikke')) continue

    const supabaseTool = toolsByUrl.get(normalizeUrl(csvTool.URL))

    if (!supabaseTool) {
      console.log(`  [IKKE FUNNET] ${csvTool.Navn}`)
      continue
    }

    console.log(`  [OPPDATER] ${supabaseTool.name}: requires_registration = false`)
    updateCount++

    if (!dryRun) {
      const { error: updateError } = await supabase
        .from('tools')
        .update({ requires_registration: false })
        .eq('id', supabaseTool.id)

      if (updateError) {
        console.log(`    Feil: ${updateError.message}`)
      }
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('SAMMENDRAG')
  console.log('='.repeat(60))
  console.log(`  Verktøy med "Delvis": ${partialTools.length}`)
  console.log(`  Oppdatert: ${updateCount}`)

  if (dryRun) {
    console.log('\nKjør med --apply for å utføre endringene')
  } else {
    console.log('\nFerdig!')
  }

  console.log('\n' + '='.repeat(60))
  console.log('MERKNAD')
  console.log('='.repeat(60))
  console.log(`
"Delvis" registrering betyr ofte at grunnfunksjoner er gratis,
men full tilgang krever konto. Dette samsvarer med "freemium"-modellen.

For disse verktøyene:
- requires_registration = false (fjerner "Registrering"-badge)
- pricing_model bør være "freemium" hvis det ikke allerede er det

Brukeren forstår at "Gratish" (freemium) ofte innebærer begrensninger.
`)
}

main().catch(console.error)
