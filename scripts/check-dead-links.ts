/**
 * Sjekker alle verktøy-URLer i Supabase for døde lenker
 *
 * Bruk: npx tsx scripts/check-dead-links.ts
 *
 * Opsjoner:
 *   --limit=N     Sjekk kun N verktøy (for testing)
 *   --output=json Skriv resultater til JSON-fil
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { writeFileSync } from 'fs'

config({ path: '.env.local' })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Mangler miljøvariabler')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Parse kommandolinje-argumenter
const args = process.argv.slice(2)
const limitArg = args.find(a => a.startsWith('--limit='))
const limit = limitArg ? parseInt(limitArg.split('=')[1]) : undefined
const outputJson = args.includes('--output=json')

interface Tool {
  id: string
  name: string
  url: string
  category_names: string[]
}

interface CheckResult {
  tool: Tool
  status: 'ok' | 'dead' | 'redirect' | 'timeout' | 'error'
  statusCode?: number
  redirectUrl?: string
  error?: string
  responseTime?: number
}

async function checkUrl(url: string, timeout = 15000): Promise<{
  status: 'ok' | 'dead' | 'redirect' | 'timeout' | 'error'
  statusCode?: number
  redirectUrl?: string
  error?: string
  responseTime?: number
}> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  const startTime = Date.now()

  try {
    const response = await fetch(url, {
      method: 'HEAD', // Bruk HEAD for å spare båndbredde
      signal: controller.signal,
      redirect: 'manual', // Ikke følg redirects automatisk
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    })

    clearTimeout(timeoutId)
    const responseTime = Date.now() - startTime

    // Sjekk for redirects
    if (response.status >= 300 && response.status < 400) {
      const redirectUrl = response.headers.get('location')
      return {
        status: 'redirect',
        statusCode: response.status,
        redirectUrl: redirectUrl || undefined,
        responseTime
      }
    }

    // Sjekk for feil
    if (response.status >= 400) {
      return {
        status: 'dead',
        statusCode: response.status,
        responseTime
      }
    }

    return {
      status: 'ok',
      statusCode: response.status,
      responseTime
    }
  } catch (error) {
    clearTimeout(timeoutId)
    const responseTime = Date.now() - startTime

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { status: 'timeout', responseTime, error: 'Timeout etter 15 sekunder' }
      }

      // Noen servere blokkerer HEAD, prøv GET
      if (error.message.includes('fetch')) {
        try {
          const getResponse = await fetch(url, {
            method: 'GET',
            signal: AbortSignal.timeout(timeout),
            redirect: 'manual',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
          })

          if (getResponse.status >= 400) {
            return { status: 'dead', statusCode: getResponse.status, responseTime: Date.now() - startTime }
          }

          if (getResponse.status >= 300 && getResponse.status < 400) {
            return {
              status: 'redirect',
              statusCode: getResponse.status,
              redirectUrl: getResponse.headers.get('location') || undefined,
              responseTime: Date.now() - startTime
            }
          }

          return { status: 'ok', statusCode: getResponse.status, responseTime: Date.now() - startTime }
        } catch {
          // Fortsett til error-håndtering
        }
      }

      return { status: 'error', error: error.message, responseTime }
    }

    return { status: 'error', error: 'Ukjent feil', responseTime }
  }
}

async function main() {
  console.log('Henter verktøy fra Supabase...\n')

  // Hent alle verktøy
  let allTools: Tool[] = []
  let offset = 0
  const pageSize = 1000

  while (true) {
    const { data, error } = await supabase
      .from('tools_with_categories')
      .select('id, name, url, category_names')
      .eq('is_active', true)
      .range(offset, offset + pageSize - 1)

    if (error) {
      console.error('Feil ved henting:', error)
      process.exit(1)
    }

    if (!data || data.length === 0) break
    allTools = allTools.concat(data as Tool[])
    offset += pageSize
    if (data.length < pageSize) break
  }

  // Begrens hvis --limit er satt
  if (limit) {
    allTools = allTools.slice(0, limit)
  }

  console.log(`Sjekker ${allTools.length} verktøy...\n`)
  console.log('='.repeat(80))

  const results: CheckResult[] = []
  const deadLinks: CheckResult[] = []
  const redirects: CheckResult[] = []
  const timeouts: CheckResult[] = []
  const errors: CheckResult[] = []

  // Behandle i batches for å unngå for mange samtidige forespørsler
  const batchSize = 10
  let processed = 0

  for (let i = 0; i < allTools.length; i += batchSize) {
    const batch = allTools.slice(i, i + batchSize)

    const batchResults = await Promise.all(
      batch.map(async (tool) => {
        const result = await checkUrl(tool.url)
        return { tool, ...result } as CheckResult
      })
    )

    for (const result of batchResults) {
      results.push(result)
      processed++

      // Vis fremdrift
      const statusIcon = {
        'ok': '✓',
        'dead': '✗',
        'redirect': '→',
        'timeout': '⏱',
        'error': '!'
      }[result.status]

      const statusColor = {
        'ok': '\x1b[32m',
        'dead': '\x1b[31m',
        'redirect': '\x1b[33m',
        'timeout': '\x1b[33m',
        'error': '\x1b[31m'
      }[result.status]

      const reset = '\x1b[0m'

      if (result.status !== 'ok') {
        console.log(`${statusColor}${statusIcon}${reset} [${processed}/${allTools.length}] ${result.tool.name}`)
        console.log(`  URL: ${result.tool.url}`)
        if (result.statusCode) console.log(`  Status: ${result.statusCode}`)
        if (result.redirectUrl) console.log(`  Redirect: ${result.redirectUrl}`)
        if (result.error) console.log(`  Feil: ${result.error}`)
        console.log('')
      } else {
        // Vis kun kort status for OK
        process.stdout.write(`\r[${processed}/${allTools.length}] Sjekker...`)
      }

      // Kategoriser
      if (result.status === 'dead') deadLinks.push(result)
      else if (result.status === 'redirect') redirects.push(result)
      else if (result.status === 'timeout') timeouts.push(result)
      else if (result.status === 'error') errors.push(result)
    }
  }

  console.log('\n')
  console.log('='.repeat(80))
  console.log('RAPPORT')
  console.log('='.repeat(80))

  console.log(`\nTotalt sjekket: ${results.length}`)
  console.log(`  ✓ OK: ${results.filter(r => r.status === 'ok').length}`)
  console.log(`  ✗ Døde lenker: ${deadLinks.length}`)
  console.log(`  → Redirects: ${redirects.length}`)
  console.log(`  ⏱ Timeout: ${timeouts.length}`)
  console.log(`  ! Feil: ${errors.length}`)

  if (deadLinks.length > 0) {
    console.log('\n--- DØDE LENKER ---')
    for (const result of deadLinks) {
      console.log(`\n${result.tool.name}`)
      console.log(`  URL: ${result.tool.url}`)
      console.log(`  Status: ${result.statusCode}`)
      console.log(`  Kategorier: ${result.tool.category_names?.join(', ') || 'Ingen'}`)
    }
  }

  if (timeouts.length > 0) {
    console.log('\n--- TIMEOUT (mulig døde) ---')
    for (const result of timeouts) {
      console.log(`\n${result.tool.name}`)
      console.log(`  URL: ${result.tool.url}`)
    }
  }

  if (errors.length > 0) {
    console.log('\n--- FEIL (mulig døde) ---')
    for (const result of errors) {
      console.log(`\n${result.tool.name}`)
      console.log(`  URL: ${result.tool.url}`)
      console.log(`  Feil: ${result.error}`)
    }
  }

  // Skriv til JSON hvis ønsket
  if (outputJson) {
    const outputData = {
      timestamp: new Date().toISOString(),
      total: results.length,
      summary: {
        ok: results.filter(r => r.status === 'ok').length,
        dead: deadLinks.length,
        redirect: redirects.length,
        timeout: timeouts.length,
        error: errors.length
      },
      deadLinks: deadLinks.map(r => ({
        id: r.tool.id,
        name: r.tool.name,
        url: r.tool.url,
        statusCode: r.statusCode,
        categories: r.tool.category_names
      })),
      timeouts: timeouts.map(r => ({
        id: r.tool.id,
        name: r.tool.name,
        url: r.tool.url
      })),
      errors: errors.map(r => ({
        id: r.tool.id,
        name: r.tool.name,
        url: r.tool.url,
        error: r.error
      })),
      redirects: redirects.map(r => ({
        id: r.tool.id,
        name: r.tool.name,
        url: r.tool.url,
        redirectUrl: r.redirectUrl,
        statusCode: r.statusCode
      }))
    }

    const filename = `dead-links-${new Date().toISOString().split('T')[0]}.json`
    writeFileSync(`dev_only/${filename}`, JSON.stringify(outputData, null, 2))
    console.log(`\nResultater skrevet til dev_only/${filename}`)
  }
}

main().catch(console.error)
