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

// Enkel hash-basert ruting
function useHashRoute() {
  const [route, setRoute] = useState(window.location.hash.slice(1) || '/')

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash.slice(1) || '/')
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  return route
}

export default function App() {
  const route = useHashRoute()
  const { tools, categories, isLoading, error, isOffline } = useTools()

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

  // Admin-rute
  if (route === '/admin') {
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
        <HelpGuide />
      </footer>
    </div>
  )
}
