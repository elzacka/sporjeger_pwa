import { useMemo, useDeferredValue } from 'react'
import Fuse, { type IFuseOptions } from 'fuse.js'
import type { ToolWithCategories } from '@/types/database'
import type { ParsedFilters } from './useFilters'

// Fuse.js konfigurasjon for fuzzy search
const fuseOptions: IFuseOptions<ToolWithCategories> = {
  keys: [
    { name: 'name', weight: 3 },
    { name: 'description', weight: 2 },
    { name: 'category_names', weight: 1.5 },
    { name: 'url', weight: 0.5 },
    { name: 'regions', weight: 1 }
  ],
  threshold: 0.3,
  ignoreLocation: true,
  includeScore: true,
  minMatchCharLength: 2
}

interface UseSearchParams {
  tools: ToolWithCategories[]
  query: string
  filters: ParsedFilters
  hasActiveFilters: boolean
}

export function useSearch({ tools, query, filters, hasActiveFilters }: UseSearchParams) {
  // Deferred value for smooth UI under skriving
  const deferredQuery = useDeferredValue(query)

  // Bygg Fuse-indeks når verktøylisten endres
  const fuse = useMemo(
    () => new Fuse(tools, fuseOptions),
    [tools]
  )

  // Filtrer og søk
  const results = useMemo(() => {
    // Hvis ingen filtre og ingen søk, returner tom liste
    if (!deferredQuery && !hasActiveFilters) {
      return []
    }

    let filtered = tools

    // Filtrer på kategorier (ELLER innenfor kategorier)
    if (filters.categories.length > 0) {
      filtered = filtered.filter(tool =>
        tool.categories && tool.categories.some(cat => filters.categories.includes(cat))
      )
    }

    // Filtrer på type (ELLER innenfor typer)
    if (filters.types.length > 0) {
      filtered = filtered.filter(tool =>
        tool.tool_type && filters.types.includes(tool.tool_type)
      )
    }

    // Filtrer på prismodell (ELLER innenfor pris)
    if (filters.pricing.length > 0) {
      filtered = filtered.filter(tool =>
        tool.pricing_model && filters.pricing.includes(tool.pricing_model)
      )
    }

    // Filtrer på regioner (ELLER innenfor regioner)
    if (filters.regions.length > 0) {
      filtered = filtered.filter(tool =>
        tool.regions && tool.regions.some(region =>
          filters.regions.includes(region) ||
          (filters.regions.includes('global') && region === 'global')
        )
      )
    }

    // Filtrer på intel cycle phase (ELLER innenfor faser)
    if (filters.phases.length > 0) {
      filtered = filtered.filter(tool =>
        tool.intel_cycle_phases && tool.intel_cycle_phases.some(phase => filters.phases.includes(phase))
      )
    }

    // Hvis vi har en søkestreng, bruk fuzzy search
    if (deferredQuery.trim()) {
      const searchResults = fuse.search(deferredQuery, { limit: 50 })

      // Hvis vi har filtre, filtrer fuzzy-resultater
      if (hasActiveFilters) {
        const filteredIds = new Set(filtered.map(t => t.id))
        return searchResults
          .filter(result => filteredIds.has(result.item.id))
          .map(result => result.item)
      }

      return searchResults.map(result => result.item)
    }

    return filtered
  }, [tools, fuse, deferredQuery, filters, hasActiveFilters])

  return {
    results,
    isSearching: deferredQuery !== query
  }
}
