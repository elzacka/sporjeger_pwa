// Sporjeger database types
// Synkronisert med Supabase-skjema

export type ToolType =
  | 'web'
  | 'terminal'
  | 'desktop'
  | 'mobile'
  | 'browser_extension'
  | 'api'
  | 'dork'
  | 'database'

export type PricingModel = 'free' | 'freemium' | 'paid'

export type IntelCyclePhase =
  | 'planning'
  | 'collection'
  | 'processing'
  | 'analysis'
  | 'dissemination'

export type Platform =
  | 'windows'
  | 'macos'
  | 'linux'
  | 'android'
  | 'ios'
  | 'web'

export interface Tool {
  id: string
  name: string
  slug: string
  description: string | null
  url: string
  tool_type: ToolType
  requires_registration: boolean
  requires_manual_url: boolean
  pricing_model: PricingModel
  platforms: Platform[]
  intel_cycle_phases: IntelCyclePhase[]
  regions: string[]
  is_active: boolean
  last_verified: string | null
  updated_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  parent_id: string | null
  sort_order: number
}

export interface ToolCategory {
  tool_id: string
  category_id: string
}

// View types
export interface ToolWithCategories extends Tool {
  categories: string[] // category slugs
  category_names: string[]
}

export interface CategoryWithCount extends Category {
  tool_count: number
}

// Filter state
export interface FilterState {
  query: string
  categories: string[]
  types: ToolType[]
  pricing: PricingModel[]
  phases: IntelCyclePhase[]
}

export const emptyFilters: FilterState = {
  query: '',
  categories: [],
  types: [],
  pricing: [],
  phases: []
}
