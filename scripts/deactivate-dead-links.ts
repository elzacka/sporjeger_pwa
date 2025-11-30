/**
 * Deaktiverer døde lenker i Supabase
 * Leser fra dead-links JSON-filen og setter is_active = false
 *
 * Bruk: npx tsx scripts/deactivate-dead-links.ts [--apply]
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync } from 'fs'
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

interface DeadLink {
  id: string
  name: string
  url: string
  statusCode?: number
  categories: string[]
}

interface DeadLinksReport {
  timestamp: string
  total: number
  summary: {
    ok: number
    dead: number
    redirect: number
    timeout: number
    error: number
  }
  deadLinks: DeadLink[]
  timeouts: Array<{ id: string; name: string; url: string }>
  errors: Array<{ id: string; name: string; url: string; error: string }>
}

async function main() {
  // Finn nyeste dead-links fil
  const files = readdirSync('dev_only')
    .filter(f => f.startsWith('dead-links-') && f.endsWith('.json'))
    .sort()
    .reverse()

  if (files.length === 0) {
    console.error('Ingen dead-links filer funnet. Kjør check-dead-links.ts først.')
    process.exit(1)
  }

  const latestFile = `dev_only/${files[0]}`
  console.log(`Leser fra: ${latestFile}\n`)

  const report: DeadLinksReport = JSON.parse(readFileSync(latestFile, 'utf-8'))

  console.log('='.repeat(60))
  console.log('SAMMENDRAG FRA RAPPORT')
  console.log('='.repeat(60))
  console.log(`Tidspunkt: ${report.timestamp}`)
  console.log(`Totalt sjekket: ${report.total}`)
  console.log(`  OK: ${report.summary.ok}`)
  console.log(`  Døde: ${report.summary.dead}`)
  console.log(`  Redirects: ${report.summary.redirect}`)
  console.log(`  Timeout: ${report.summary.timeout}`)
  console.log(`  Feil: ${report.summary.error}`)

  // Filtrer kun sikre døde lenker (ekskluder 403 som ofte er bot-blokkering)
  // 403 = Forbidden (ofte fungerer i nettleser)
  // 404 = Not Found (sikker)
  // 410 = Gone (sikker)
  // 5xx = Server error (sikker)
  const safeToDeactivate = report.deadLinks.filter(link => {
    const code = link.statusCode
    if (!code) return false
    // Ekskluder 403 (ofte falske positiver fra bot-blokkering)
    if (code === 403) return false
    // Inkluder 404, 410, og alle 5xx
    return code === 404 || code === 410 || code >= 500
  })

  // Ekskluder timeouts og generelle feil (ofte midlertidige)
  const toDeactivate = safeToDeactivate

  const skipped403 = report.deadLinks.filter(l => l.statusCode === 403).length
  const skippedOther = report.deadLinks.length - safeToDeactivate.length - skipped403

  console.log(`\nFiltrering:`)
  console.log(`  Døde lenker totalt: ${report.deadLinks.length}`)
  console.log(`  - Ekskludert 403 (bot-blokkering): ${skipped403}`)
  console.log(`  - Ekskludert andre (400, 405, etc.): ${skippedOther}`)
  console.log(`  - Ekskludert timeout: ${report.timeouts.length}`)
  console.log(`  - Ekskludert feil: ${report.errors.length}`)
  console.log(`\nSikre å deaktivere (404, 410, 5xx): ${toDeactivate.length}`)

  if (dryRun) {
    console.log('\n*** DRY RUN - ingen endringer vil bli gjort ***')
    console.log('Kjør med --apply for å deaktivere lenkene\n')
  }

  console.log('\n' + '='.repeat(60))
  console.log('VERKTØY SOM VIL BLI DEAKTIVERT (404, 410, 5xx)')
  console.log('='.repeat(60))

  for (const link of toDeactivate) {
    console.log(`  ${link.name} (${link.statusCode}) - ${link.url}`)
  }

  if (!dryRun) {
    console.log('\n' + '='.repeat(60))
    console.log('DEAKTIVERER VERKTØY...')
    console.log('='.repeat(60))

    let successCount = 0
    let errorCount = 0

    for (const link of toDeactivate) {
      const { error } = await supabase
        .from('tools')
        .update({ is_active: false })
        .eq('id', link.id)

      if (error) {
        console.log(`  [FEIL] ${link.name}: ${error.message}`)
        errorCount++
      } else {
        successCount++
      }
    }

    console.log(`\nFullført: ${successCount} deaktivert, ${errorCount} feil`)
  }

  console.log('\n' + '='.repeat(60))
  console.log('FERDIG')
  console.log('='.repeat(60))

  if (dryRun) {
    console.log('\nKjør med --apply for å deaktivere lenkene')
  }
}

main().catch(console.error)
