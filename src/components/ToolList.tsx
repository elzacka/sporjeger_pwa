import { memo } from 'react'
import type { ToolWithCategories } from '@/types/database'
import { ToolCard } from './ToolCard'
import { t } from '@/lib/i18n'
import styles from './ToolList.module.css'

interface ToolListProps {
  tools: ToolWithCategories[]
  isSearching: boolean
  hasActiveFilters: boolean
}

export const ToolList = memo(function ToolList({
  tools,
  isSearching,
  hasActiveFilters
}: ToolListProps) {
  // Vis ingenting før bruker har søkt eller filtrert
  if (!hasActiveFilters) {
    return null
  }

  // Ingen resultater
  if (tools.length === 0) {
    return (
      <div className={styles.empty}>
        <p>{t.ui.noResults}</p>
        <p className={styles.hint}>{t.ui.noResultsHint}</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.count} aria-live="polite">
        {isSearching ? (
          <span className={styles.searching}>Søker...</span>
        ) : (
          <span>
            {tools.length} {tools.length === 1 ? t.ui.tool : t.ui.tools}
          </span>
        )}
      </div>

      <div className={styles.list} role="feed" aria-busy={isSearching}>
        {tools.map(tool => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </div>
  )
})
