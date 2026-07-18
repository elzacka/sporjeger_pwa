import { useTools } from '@/hooks/useTools'
import { useFilters } from '@/hooks/useFilters'
import { useSearch } from '@/hooks/useSearch'
import { CommandSearch } from '@/components/CommandSearch'
import { ToolList } from '@/components/ToolList'
import { HelpGuide } from '@/components/HelpGuide'
import { InstallPrompt } from '@/components/InstallPrompt'
import { t } from '@/lib/i18n'
import styles from './App.module.css'

export default function App() {
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

        {tools.length > 0 && (
          <div className={styles.totalCount}>
            {tools.length} {t.ui.toolsInCatalog}
          </div>
        )}

        <ToolList
          tools={results}
          isSearching={isSearching}
          hasActiveFilters={hasActiveFilters}
        />
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerRow}>
          <span>{t.ui.footer}</span>
          <HelpGuide />
        </div>
        <a
          className={styles.credit}
          href="https://github.com/elzacka"
          target="_blank"
          rel="noopener noreferrer"
        >
          – laget av elzacka; inspirert av Bellingcat
        </a>
      </footer>

      <InstallPrompt />
    </div>
  )
}
