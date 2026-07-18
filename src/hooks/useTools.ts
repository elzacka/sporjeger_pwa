import { useState, useEffect, useCallback } from 'react'
import type { ToolWithCategories, CategoryWithCount } from '@/types/database'
import { getTools, getCategories } from '@/lib/supabase'

// Cache-nøkler for localStorage
// Bump CACHE_VERSION ved skjemaendringer i databasen/typene,
// slik at brukere ikke får utdatert datastruktur i opptil 1 time
const CACHE_VERSION = 2
const CACHE_KEY_TOOLS = `sporjeger_tools_cache_v${CACHE_VERSION}`
const CACHE_KEY_CATEGORIES = `sporjeger_categories_cache_v${CACHE_VERSION}`
const CACHE_TTL = 1000 * 60 * 60 // 1 time

interface CacheEntry<T> {
  data: T
  timestamp: number
}

function getFromCache<T>(key: string): T | null {
  try {
    const cached = localStorage.getItem(key)
    if (!cached) return null

    const entry: CacheEntry<T> = JSON.parse(cached)
    if (typeof entry?.timestamp !== 'number' || !Array.isArray(entry?.data)) {
      // Korrupt eller uventet form - forkast
      localStorage.removeItem(key)
      return null
    }
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      localStorage.removeItem(key)
      return null
    }

    return entry.data
  } catch {
    return null
  }
}

// Rydd bort cache fra tidligere versjoner
function pruneOldCaches(): void {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i)
      if (
        key &&
        (key.startsWith('sporjeger_tools_cache') || key.startsWith('sporjeger_categories_cache')) &&
        key !== CACHE_KEY_TOOLS &&
        key !== CACHE_KEY_CATEGORIES
      ) {
        localStorage.removeItem(key)
      }
    }
  } catch {
    // Ignorer feil
  }
}

function setCache<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() }
    localStorage.setItem(key, JSON.stringify(entry))
  } catch {
    // localStorage kan være full eller blokkert
  }
}

// Tøm cache - eksporteres for bruk i andre komponenter
export function clearToolsCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY_TOOLS)
    localStorage.removeItem(CACHE_KEY_CATEGORIES)
  } catch {
    // Ignorer feil
  }
}

export function useTools() {
  const [tools, setTools] = useState<ToolWithCategories[]>([])
  const [categories, setCategories] = useState<CategoryWithCount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  // Lytt til online/offline-endringer
  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Last data
  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    // Prøv cache først hvis offline
    if (!navigator.onLine) {
      const cachedTools = getFromCache<ToolWithCategories[]>(CACHE_KEY_TOOLS)
      const cachedCategories = getFromCache<CategoryWithCount[]>(CACHE_KEY_CATEGORIES)

      if (cachedTools && cachedCategories) {
        setTools(cachedTools)
        setCategories(cachedCategories)
        setIsLoading(false)
        return
      }
    }

    try {
      const [toolsData, categoriesData] = await Promise.all([
        getTools(),
        getCategories()
      ])

      setTools(toolsData)
      setCategories(categoriesData)

      // Oppdater cache
      setCache(CACHE_KEY_TOOLS, toolsData)
      setCache(CACHE_KEY_CATEGORIES, categoriesData)
    } catch (err) {
      console.error('Feil ved lasting av data:', err)

      // Fall tilbake til cache ved feil
      const cachedTools = getFromCache<ToolWithCategories[]>(CACHE_KEY_TOOLS)
      const cachedCategories = getFromCache<CategoryWithCount[]>(CACHE_KEY_CATEGORIES)

      if (cachedTools && cachedCategories) {
        setTools(cachedTools)
        setCategories(cachedCategories)
        setError('Kunne ikke oppdatere data. Viser bufret versjon.')
      } else {
        setError('Kunne ikke laste verktøy. Sjekk internettforbindelsen.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    pruneOldCaches()
    loadData()
  }, [loadData])

  // Tøm cache og last på nytt
  const hardRefresh = useCallback(async () => {
    clearToolsCache()
    await loadData()
  }, [loadData])

  return {
    tools,
    categories,
    isLoading,
    error,
    isOffline,
    refresh: loadData,
    hardRefresh
  }
}
