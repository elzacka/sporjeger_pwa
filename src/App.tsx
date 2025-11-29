import { useState, useEffect, lazy, Suspense } from 'react'
import { useTools } from '@/hooks/useTools'
import { useFilters } from '@/hooks/useFilters'
import { useSearch } from '@/hooks/useSearch'
import { useAuth } from '@/hooks/useAuth'
import { CommandSearch } from '@/components/CommandSearch'
import { ToolList } from '@/components/ToolList'
import { HelpGuide } from '@/components/HelpGuide'
import { DorksGuide } from '@/components/DorksGuide'
import { AdminLogin } from '@/components/AdminLogin'
import { t } from '@/lib/i18n'
import styles from './App.module.css'

// Lazy load AdminPanel - lastes kun nar admin-rute besokes
const AdminPanel = lazy(() => import('@/components/AdminPanel').then(m => ({ default: m.AdminPanel })))

// Enkel hash-basert ruting
function useHashRoute() {
  const [route, setRoute] = useState(() => {
    const hash = window.location.hash.slice(1) || '/'
    return hash.split('?')[0]
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

export default function App() {
  const route = useHashRoute()
  const { tools, categories, isLoading, error, isOffline } = useTools()
  const { isAuthenticated, isLoading: authLoading, signOut } = useAuth()

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

  // Admin-rute med Supabase Auth
  if (route === '/admin') {
    // Venter pa auth-sjekk
    if (authLoading) {
      return (
        <main className={styles.main}>
          <div className={styles.loading}>Sjekker tilgang...</div>
        </main>
      )
    }

    // Ikke innlogget - vis innloggingsside
    if (!isAuthenticated) {
      return <AdminLogin onBack={() => window.location.href = '/'} />
    }

    // Innlogget - vis admin-panel
    return (
      <Suspense fallback={<div className={styles.loading}>Laster admin...</div>}>
        <AdminPanel onSignOut={signOut} />
      </Suspense>
    )
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
        <DorksGuide />
        <HelpGuide />
      </footer>
    </div>
  )
}
