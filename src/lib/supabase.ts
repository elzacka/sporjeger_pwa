import { createClient } from '@supabase/supabase-js'
import type { ToolWithCategories, CategoryWithCount } from '@/types/database'

// Disse verdiene må fylles inn med dine Supabase-credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials mangler. Opprett .env fil med VITE_SUPABASE_URL og VITE_SUPABASE_ANON_KEY'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Parser intel_cycle_phases fra PostgreSQL array-streng til JS array
function parsePostgresArray(value: string | string[] | null): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value
  // Håndter PostgreSQL array format: "{collection,analysis}"
  if (typeof value === 'string' && value.startsWith('{')) {
    return value.slice(1, -1).split(',').filter(Boolean)
  }
  return []
}

// Hent alle aktive verktøy med kategorier
// Supabase har en standard grense på 1000 rader, så vi henter i batcher
export async function getTools(): Promise<ToolWithCategories[]> {
  const allTools: ToolWithCategories[] = []
  const batchSize = 1000
  let offset = 0
  let hasMore = true

  while (hasMore) {
    const { data, error } = await supabase
      .from('tools_with_categories')
      .select('*')
      .eq('is_active', true)
      .order('name')
      .range(offset, offset + batchSize - 1)

    if (error) {
      console.error('Feil ved henting av verktøy:', error)
      break
    }

    if (data && data.length > 0) {
      // Transformer og legg til
      const transformed = data.map(tool => ({
        ...tool,
        categories: tool.category_slugs ?? [],
        intel_cycle_phases: parsePostgresArray(tool.intel_cycle_phases)
      }))
      allTools.push(...transformed)
      offset += batchSize

      // Hvis vi fikk færre enn batchSize, er vi ferdige
      if (data.length < batchSize) {
        hasMore = false
      }
    } else {
      hasMore = false
    }
  }

  return allTools
}

// Hent alle kategorier med antall verktøy
export async function getCategories(): Promise<CategoryWithCount[]> {
  const { data, error } = await supabase
    .from('category_counts')
    .select('*')
    .order('sort_order')

  if (error) {
    console.error('Feil ved henting av kategorier:', error)
    return []
  }

  return data ?? []
}

// Hent et enkelt verktøy via slug
export async function getToolBySlug(slug: string): Promise<ToolWithCategories | null> {
  const { data, error } = await supabase
    .from('tools_with_categories')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    console.error('Feil ved henting av verktøy:', error)
    return null
  }

  return data
}
