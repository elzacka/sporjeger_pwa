import { useState, useCallback, useMemo } from 'react'
import type { ToolType, PricingModel, IntelCyclePhase } from '@/types/database'

// Filter-typer
export type FilterType = 'category' | 'type' | 'price' | 'region' | 'phase'

export interface ActiveFilter {
  type: FilterType
  value: string
  label: string
}

export interface ParsedFilters {
  categories: string[]
  types: ToolType[]
  pricing: PricingModel[]
  regions: string[]
  phases: IntelCyclePhase[]
}

export function useFilters() {
  const [query, setQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([])

  // Legg til filter
  const addFilter = useCallback((filter: ActiveFilter) => {
    setActiveFilters(prev => {
      // Unngå duplikater
      if (prev.some(f => f.type === filter.type && f.value === filter.value)) {
        return prev
      }
      return [...prev, filter]
    })
  }, [])

  // Fjern filter
  const removeFilter = useCallback((filter: ActiveFilter) => {
    setActiveFilters(prev =>
      prev.filter(f => !(f.type === filter.type && f.value === filter.value))
    )
  }, [])

  // Nullstill alt
  const clearAll = useCallback(() => {
    setQuery('')
    setActiveFilters([])
  }, [])

  // Parse aktive filtre til strukturert format
  const parsedFilters = useMemo((): ParsedFilters => {
    const result: ParsedFilters = {
      categories: [],
      types: [],
      pricing: [],
      regions: [],
      phases: []
    }

    for (const filter of activeFilters) {
      switch (filter.type) {
        case 'category':
          result.categories.push(filter.value)
          break
        case 'type':
          result.types.push(filter.value as ToolType)
          break
        case 'price':
          result.pricing.push(filter.value as PricingModel)
          break
        case 'region':
          result.regions.push(filter.value)
          break
        case 'phase':
          result.phases.push(filter.value as IntelCyclePhase)
          break
      }
    }

    return result
  }, [activeFilters])

  // Sjekk om vi har aktive filtre
  const hasActiveFilters = query.length > 0 || activeFilters.length > 0

  return {
    query,
    setQuery,
    activeFilters,
    addFilter,
    removeFilter,
    clearAll,
    parsedFilters,
    hasActiveFilters
  }
}
