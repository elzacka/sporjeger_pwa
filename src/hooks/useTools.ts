import { useState, useEffect, useCallback } from 'react'
import type { ToolWithCategories, CategoryWithCount } from '@/types/database'
import { getTools, getCategories } from '@/lib/supabase'

// Cache-nøkler for localStorage
const CACHE_KEY_TOOLS = 'sporjeger_tools_cache'
const CACHE_KEY_CATEGORIES = 'sporjeger_categories_cache'
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
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      localStorage.removeItem(key)
      return null
    }

    return entry.data
  } catch {
    return null
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
    loadData()
  }, [loadData])

  return {
    tools,
    categories,
    isLoading,
    error,
    isOffline,
    refresh: loadData
  }
}
