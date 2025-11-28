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
export async function getTools(): Promise<ToolWithCategories[]> {
  const { data, error } = await supabase
    .from('tools_with_categories')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (error) {
    console.error('Feil ved henting av verktøy:', error)
    return []
  }

  // Transformer data for å matche forventet struktur
  return (data ?? []).map(tool => ({
    ...tool,
    // Map category_slugs til categories for kompatibilitet
    categories: tool.category_slugs ?? [],
    // Parse intel_cycle_phases hvis det er en streng
    intel_cycle_phases: parsePostgresArray(tool.intel_cycle_phases)
  }))
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
