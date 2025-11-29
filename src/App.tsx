import { useState, useEffect } from 'react'
import { useTools } from '@/hooks/useTools'
import { useFilters } from '@/hooks/useFilters'
import { useSearch } from '@/hooks/useSearch'
import { CommandSearch } from '@/components/CommandSearch'
import { ToolList } from '@/components/ToolList'
import { HelpGuide } from '@/components/HelpGuide'
import { AdminPanel } from '@/components/AdminPanel'
import { t } from '@/lib/i18n'
import styles from './App.module.css'

// Admin-nokkel fra miljovariabel (sett i .env)
const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY || ''

// Enkel hash-basert ruting med query params
function useHashRoute() {
  const [route, setRoute] = useState(() => {
    const hash = window.location.hash.slice(1) || '/'
    return hash.split('?')[0] // Fjern query params fra rute
  })

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || '/'
      setRoute(hash.split('?')[0])
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  return route
}

// Sjekk om admin-nokkel er gyldig
function checkAdminAccess(): boolean {
  // Hvis ingen nokkel er satt i env, tillat tilgang (utvikling)
  if (!ADMIN_KEY) return true

  // Hent nokkel fra URL query params
  const hash = window.location.hash
  const queryIndex = hash.indexOf('?')
  if (queryIndex === -1) return false

  const params = new URLSearchParams(hash.slice(queryIndex + 1))
  const providedKey = params.get('key')

  return providedKey === ADMIN_KEY
}

export default function App() {
  const route = useHashRoute()
  const { tools, categories, isLoading, error, isOffline, hardRefresh } = useTools()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await hardRefresh()
    setIsRefreshing(false)
  }

  const {
    query,
    setQuery,
    activeFilters,
    addFilter,
    removeFilter,
    clearAll,
    parsedFilters,
    hasActiveFilters
  } = useFilters()

  const { results, isSearching } = useSearch({
    tools,
    query,
    filters: parsedFilters,
    hasActiveFilters
  })

  // Admin-rute med tilgangskontroll
  if (route === '/admin') {
    if (!checkAdminAccess()) {
      return (
        <main className={styles.main}>
          <div className={styles.accessDenied}>
            <h1>Ingen tilgang</h1>
            <p>Admin krever gyldig nokkel.</p>
            <a href="/">Tilbake til Sporjeger</a>
          </div>
        </main>
      )
    }
    return <AdminPanel />
  }

  // Loading state
  if (isLoading) {
    return (
      <main className={styles.main}>
        <div className={styles.loading}>{t.ui.loading}</div>
      </main>
    )
  }

  return (
    <div className={styles.app}>
      {/* Offline-indikator */}
      {isOffline && (
        <div className={styles.offline} role="status">
          {t.ui.offline}
        </div>
      )}

      {/* Feilmelding */}
      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      <main className={`${styles.main} ${hasActiveFilters ? styles.hasResults : ''}`}>
        <CommandSearch
          categories={categories}
          query={query}
          activeFilters={activeFilters}
          onQueryChange={setQuery}
          onAddFilter={addFilter}
          onRemoveFilter={removeFilter}
          onClearAll={clearAll}
        />

        <ToolList
          tools={results}
          isSearching={isSearching}
          hasActiveFilters={hasActiveFilters}
        />
      </main>

      <footer className={styles.footer}>
        <span>{t.ui.footer}</span>
        <button
          className={styles.refreshButton}
          onClick={handleRefresh}
          disabled={isRefreshing}
          title="Tøm cache og hent oppdatert data fra Supabase"
        >
          {isRefreshing ? 'Oppdaterer...' : 'Oppdater'}
        </button>
        <HelpGuide />
      </footer>
    </div>
  )
}
