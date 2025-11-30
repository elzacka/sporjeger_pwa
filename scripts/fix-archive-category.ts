/**
 * Fikser arkiv-kategorier:
 * 1. Oppretter ny kategori "Archive" (Arkiv) for verktøy som gir tilgang til arkiver
 * 2. Flytter verktøy med "Søkemotorer, Arkiv" i Category Path til denne kategorien
 * 3. Beholder "Archiving" for verktøy som brukes til å arkivere nettsider
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
  Kategori: string
  Navn: string
  URL: string
  'Category Path': string
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

  // Finn verktøy med "Søkemotorer, Arkiv" i Category Path (tilgang til arkiver)
  const archiveAccessTools = records.filter(r =>
    r['Category Path']?.includes('Søkemotorer, Arkiv')
  )

  // Finn verktøy med "Arkiv og databaser, Diverse" (arkiveringsverktøy)
  const archivingTools = records.filter(r =>
    r['Category Path']?.includes('Arkiv og databaser, Diverse')
  )

  console.log('='.repeat(60))
  console.log('ANALYSE AV ARKIV-KATEGORIER')
  console.log('='.repeat(60))
  console.log(`\nVerktøy som gir TILGANG til arkiver (Søkemotorer, Arkiv): ${archiveAccessTools.length}`)
  for (const tool of archiveAccessTools) {
    console.log(`  - ${tool.Navn}`)
  }

  console.log(`\nVerktøy for ARKIVERING (Arkiv og databaser, Diverse): ${archivingTools.length}`)
  for (const tool of archivingTools.slice(0, 10)) {
    console.log(`  - ${tool.Navn}`)
  }
  if (archivingTools.length > 10) {
    console.log(`  ... og ${archivingTools.length - 10} til`)
  }

  // ============================================
  // STEG 1: Opprett ny kategori "Archive"
  // ============================================
  console.log('\n' + '='.repeat(60))
  console.log('STEG 1: Oppretter kategori "Archive" (Arkiv)')
  console.log('='.repeat(60))

  const { data: existingCategories } = await supabase
    .from('categories')
    .select('id, name, slug')

  const archiveCategory = existingCategories?.find(c => c.slug === 'archive')
  let archiveCategoryId: string

  if (archiveCategory) {
    console.log(`\n  Kategori "Archive" finnes allerede (ID: ${archiveCategory.id})`)
    archiveCategoryId = archiveCategory.id
  } else {
    console.log('\n  Oppretter ny kategori "Archive"...')
    if (!dryRun) {
      const { data, error } = await supabase
        .from('categories')
        .insert({ name: 'Archive', slug: 'archive', sort_order: 25 })
        .select('id')
        .single()

      if (error) {
        console.error(`  Feil: ${error.message}`)
        process.exit(1)
      }
      archiveCategoryId = data.id
      console.log(`  Opprettet med ID: ${archiveCategoryId}`)
    } else {
      archiveCategoryId = 'DRY-RUN-ID'
      console.log('  [DRY RUN] Ville opprettet kategori')
    }
  }

  // ============================================
  // STEG 2: Hent verktøy fra Supabase
  // ============================================
  console.log('\n' + '='.repeat(60))
  console.log('STEG 2: Henter verktøy fra Supabase')
  console.log('='.repeat(60))

  const { data: tools } = await supabase
    .from('tools')
    .select('id, name, url')

  const toolsByUrl = new Map<string, { id: string; name: string }>()
  for (const tool of tools || []) {
    toolsByUrl.set(normalizeUrl(tool.url), { id: tool.id, name: tool.name })
  }

  console.log(`\n  Hentet ${tools?.length || 0} verktøy`)

  // Hent archiving-kategori ID
  const archivingCategory = existingCategories?.find(c => c.slug === 'archiving')
  const archivingCategoryId = archivingCategory?.id

  // ============================================
  // STEG 3: Oppdater kategoritilhørighet
  // ============================================
  console.log('\n' + '='.repeat(60))
  console.log('STEG 3: Oppdaterer kategoritilhørighet')
  console.log('='.repeat(60))

  let addedToArchive = 0
  let removedFromArchiving = 0

  for (const csvTool of archiveAccessTools) {
    if (!csvTool.URL || csvTool.URL.startsWith('Ikke')) continue

    const tool = toolsByUrl.get(normalizeUrl(csvTool.URL))
    if (!tool) {
      console.log(`\n  [IKKE FUNNET] ${csvTool.Navn}`)
      continue
    }

    console.log(`\n  ${tool.name}:`)

    // Legg til i "archive" kategori
    console.log(`    + Legger til i "Archive"`)
    addedToArchive++

    if (!dryRun) {
      // Sjekk om allerede koblet
      const { data: existing } = await supabase
        .from('tool_categories')
        .select('tool_id')
        .eq('tool_id', tool.id)
        .eq('category_id', archiveCategoryId)
        .single()

      if (!existing) {
        await supabase
          .from('tool_categories')
          .insert({ tool_id: tool.id, category_id: archiveCategoryId })
      }
    }

    // Fjern fra "archiving" hvis den er der
    if (archivingCategoryId) {
      const { data: hasArchiving } = await supabase
        .from('tool_categories')
        .select('tool_id')
        .eq('tool_id', tool.id)
        .eq('category_id', archivingCategoryId)
        .single()

      if (hasArchiving) {
        console.log(`    - Fjerner fra "Archiving"`)
        removedFromArchiving++

        if (!dryRun) {
          await supabase
            .from('tool_categories')
            .delete()
            .eq('tool_id', tool.id)
            .eq('category_id', archivingCategoryId)
        }
      }
    }
  }

  // ============================================
  // SAMMENDRAG
  // ============================================
  console.log('\n' + '='.repeat(60))
  console.log('SAMMENDRAG')
  console.log('='.repeat(60))
  console.log(`  Ny kategori "Archive" opprettet: ${archiveCategory ? 'Nei (fantes)' : 'Ja'}`)
  console.log(`  Verktøy lagt til i "Archive": ${addedToArchive}`)
  console.log(`  Verktøy fjernet fra "Archiving": ${removedFromArchiving}`)

  if (dryRun) {
    console.log('\nKjør med --apply for å utføre endringene')
  } else {
    console.log('\nFerdig!')
  }
}

main().catch(console.error)
