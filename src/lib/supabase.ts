import { createClient } from '@supabase/supabase-js'
import type { Tool, Category, ToolWithCategories, CategoryWithCount } from '@/types/database'

// Disse verdiene må fylles inn med dine Supabase-credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials mangler. Opprett .env fil med VITE_SUPABASE_URL og VITE_SUPABASE_ANON_KEY'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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

  return data ?? []
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
