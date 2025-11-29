import { useState, useRef, useEffect, useMemo, memo } from 'react'
import type { CategoryWithCount } from '@/types/database'
import { t } from '@/lib/i18n'
import { TOOL_TYPES, PRICING_MODELS, INTEL_PHASES, REGIONS } from '@/constants/filters'
import styles from './CommandSearch.module.css'

// Filter-typer
type FilterType = 'category' | 'type' | 'price' | 'region' | 'phase'

interface ActiveFilter {
  type: FilterType
  value: string
  label: string
}

interface CommandSearchProps {
  categories: CategoryWithCount[]
  query: string
  activeFilters: ActiveFilter[]
  onQueryChange: (query: string) => void
  onAddFilter: (filter: ActiveFilter) => void
  onRemoveFilter: (filter: ActiveFilter) => void
  onClearAll: () => void
}

// Placeholder-tekster som roterer
const placeholderTexts = [
  'Let i arkiver...',
  'Finn sårbarheter...',
  'Spor fartøy...',
  'Søk i sosiale medier...',
  'Finn folk...',
  'Analyser store datamengder...',
  'Finn mønstre...',
  'Bruk verktøy for geolokalisering...',
  'Analyser nettsider...',
]

export const CommandSearch = memo(function CommandSearch({
  categories,
  query,
  activeFilters,
  onQueryChange,
  onAddFilter,
  onRemoveFilter,
  onClearAll,
}: CommandSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Roter placeholder-tekst
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex(i => (i + 1) % placeholderTexts.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // Bygg suggestions basert på query
  const suggestions = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return []

    const results: { type: FilterType; value: string; label: string; matchedOn: string }[] = []

    // Søk i kategorier
    if (categories && categories.length > 0) {
      categories.forEach(cat => {
        const norwegianName = t.category[cat.slug as keyof typeof t.category] ?? cat.name
        if (norwegianName.toLowerCase().includes(q) || cat.slug.includes(q)) {
          results.push({
            type: 'category',
            value: cat.slug,
            label: norwegianName,
            matchedOn: 'kategori'
          })
        }
      })
    }

    // Sok i verktoytyper
    TOOL_TYPES.forEach(tf => {
      if (tf.label.toLowerCase().includes(q) || tf.value.includes(q)) {
        results.push({
          type: 'type',
          value: tf.value,
          label: tf.label,
          matchedOn: 'type'
        })
      }
    })

    // Sok i prismodeller
    PRICING_MODELS.forEach(pf => {
      if (pf.label.toLowerCase().includes(q) || pf.value.includes(q)) {
        results.push({
          type: 'price',
          value: pf.value,
          label: pf.label,
          matchedOn: 'pris'
        })
      }
    })

    // Sok i regioner
    REGIONS.forEach(rf => {
      if (rf.label.toLowerCase().includes(q) || rf.value.toLowerCase().includes(q)) {
        results.push({
          type: 'region',
          value: rf.value,
          label: rf.label,
          matchedOn: 'region'
        })
      }
    })

    // Sok i faser
    INTEL_PHASES.forEach(pf => {
      if (pf.label.toLowerCase().includes(q) || pf.value.includes(q)) {
        results.push({
          type: 'phase',
          value: pf.value,
          label: pf.label,
          matchedOn: 'fase'
        })
      }
    })

    // Fjern allerede aktive filtre
    return results.filter(r =>
      !activeFilters.some(af => af.type === r.type && af.value === r.value)
    ).slice(0, 6)
  }, [query, categories, activeFilters])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K eller Cmd+K fokuserer søkefeltet
      if ((e.ctrlKey || e.metaKey) && e.key === 'k' && document.activeElement !== inputRef.current) {
        e.preventDefault()
        inputRef.current?.focus()
        setIsExpanded(true)
      }

      // Escape lukker og nullstiller
      if (e.key === 'Escape') {
        if (query || activeFilters.length > 0) {
          onClearAll()
        }
        inputRef.current?.blur()
        setIsExpanded(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [query, activeFilters, onClearAll])

  // Input-spesifikk keyboard navigation
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && suggestions[selectedIndex]) {
      e.preventDefault()
      const s = suggestions[selectedIndex]
      onAddFilter({ type: s.type, value: s.value, label: s.label })
      onQueryChange('')
      setSelectedIndex(0)
    } else if (e.key === 'Backspace' && !query && activeFilters.length > 0) {
      // Backspace på tom input fjerner siste filter
      onRemoveFilter(activeFilters[activeFilters.length - 1])
    }
  }

  const handleSuggestionClick = (suggestion: typeof suggestions[0]) => {
    onAddFilter({ type: suggestion.type, value: suggestion.value, label: suggestion.label })
    onQueryChange('')
    setSelectedIndex(0)
    inputRef.current?.focus()
  }

  const handleFilterRemove = (filter: ActiveFilter) => {
    onRemoveFilter(filter)
    inputRef.current?.focus()
  }

  const hasContent = query || activeFilters.length > 0

  // Sorter kategorier alfabetisk på norsk navn (kun de med verktøy)
  const sortedCategories = useMemo(() => {
    if (!categories) return []
    return [...categories]
      .filter(cat => (cat.tool_count ?? 0) > 0)
      .sort((a, b) => {
        const nameA = t.category[a.slug as keyof typeof t.category] ?? a.name
        const nameB = t.category[b.slug as keyof typeof t.category] ?? b.name
        return nameA.localeCompare(nameB, 'nb')
      })
  }, [categories])

  // Sjekk om et filter allerede er aktivt
  const isFilterActive = (type: FilterType, value: string) =>
    activeFilters.some(f => f.type === type && f.value === value)

  return (
    <div className={styles.container}>
      <div className={`${styles.inputWrapper} ${isExpanded ? styles.expanded : ''}`}>
        {/* Aktive filtre som tags inne i input-feltet */}
        <div className={styles.inputContent}>
          {activeFilters.map((filter) => (
            <span key={`${filter.type}-${filter.value}`} className={styles.filterTag}>
              <span className={styles.filterType}>{filter.type === 'category' ? '' : `${getFilterTypeLabel(filter.type)}:`}</span>
              {filter.label}
              <button
                type="button"
                className={styles.removeTag}
                onClick={() => handleFilterRemove(filter)}
                aria-label={`Fjern filter: ${filter.label}`}
              >
                ×
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            type="text"
            className={styles.input}
            value={query}
            placeholder={activeFilters.length === 0 ? placeholderTexts[placeholderIndex] : ''}
            onChange={e => {
              onQueryChange(e.target.value)
              setSelectedIndex(0)
            }}
            onFocus={() => setIsExpanded(true)}
            onBlur={() => {
              // Delay for å tillate klikk på suggestions
              setTimeout(() => setIsExpanded(false), 150)
            }}
            onKeyDown={handleInputKeyDown}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-label="Søk etter OSINT-verktøy"
            aria-expanded={suggestions.length > 0}
            aria-controls="search-suggestions"
          />
        </div>

        {hasContent && (
          <button
            type="button"
            className={styles.clearButton}
            onClick={onClearAll}
            aria-label="Nullstill"
          >
            Nullstill
          </button>
        )}

        {!hasContent && (
          <kbd className={styles.hint} aria-hidden="true">Ctrl K</kbd>
        )}
      </div>

      {/* Suggestions dropdown */}
      {isExpanded && suggestions.length > 0 && (
        <ul
          id="search-suggestions"
          className={styles.suggestions}
          role="listbox"
        >
          {suggestions.map((s, i) => (
            <li
              key={`${s.type}-${s.value}`}
              className={`${styles.suggestion} ${i === selectedIndex ? styles.selected : ''}`}
              role="option"
              aria-selected={i === selectedIndex}
              onMouseDown={() => handleSuggestionClick(s)}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              <span className={styles.suggestionLabel}>{s.label}</span>
              <span className={styles.suggestionMeta}>{s.matchedOn}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Expandable filter-boks */}
      <div className={styles.filterBox}>
        <button
          type="button"
          className={`${styles.filterToggle} ${filtersOpen ? styles.open : ''}`}
          onClick={() => setFiltersOpen(!filtersOpen)}
          aria-expanded={filtersOpen}
          aria-controls="filter-panel"
        >
          <span>Filtre</span>
          <svg
            className={styles.toggleIcon}
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M3 4.5L6 7.5L9 4.5" />
          </svg>
        </button>

        {filtersOpen && (
          <div id="filter-panel" className={styles.filterPanel}>
            {/* OSINT-faser */}
            <div className={styles.filterSection}>
              <span className={styles.filterSectionLabel}>Fase</span>
              <div className={styles.filterButtons}>
                {INTEL_PHASES.map(phase => (
                  <button
                    key={phase.value}
                    type="button"
                    className={`${styles.filterButton} ${isFilterActive('phase', phase.value) ? styles.active : ''}`}
                    onClick={() => {
                      if (isFilterActive('phase', phase.value)) {
                        onRemoveFilter({ type: 'phase', value: phase.value, label: phase.label })
                      } else {
                        onAddFilter({ type: 'phase', value: phase.value, label: phase.label })
                      }
                    }}
                  >
                    {phase.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Kategorier alfabetisk */}
            <div className={styles.filterSection}>
              <span className={styles.filterSectionLabel}>Kategori</span>
              <div className={styles.filterButtons}>
                {sortedCategories.map(cat => {
                  const label = t.category[cat.slug as keyof typeof t.category] ?? cat.name
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      className={`${styles.filterButton} ${isFilterActive('category', cat.slug) ? styles.active : ''}`}
                      onClick={() => {
                        if (isFilterActive('category', cat.slug)) {
                          onRemoveFilter({ type: 'category', value: cat.slug, label })
                        } else {
                          onAddFilter({ type: 'category', value: cat.slug, label })
                        }
                      }}
                    >
                      {label}
                      <span className={styles.filterCount}>({cat.tool_count})</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

function getFilterTypeLabel(type: FilterType): string {
  switch (type) {
    case 'type': return 'type'
    case 'price': return 'pris'
    case 'region': return 'region'
    case 'phase': return 'fase'
    default: return ''
  }
}
