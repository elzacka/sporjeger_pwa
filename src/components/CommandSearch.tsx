import { useState, useRef, useEffect, useMemo } from 'react'
import type { CategoryWithCount, ToolType, PricingModel, IntelCyclePhase } from '@/types/database'
import { t } from '@/lib/i18n'
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

// Alle filterverdier med norske labels
const typeFilters: { value: ToolType; label: string }[] = [
  { value: 'web', label: 'Nettside' },
  { value: 'terminal', label: 'Terminal' },
  { value: 'desktop', label: 'Program' },
  { value: 'browser_extension', label: 'Utvidelse' },
  { value: 'mobile', label: 'Mobilapp' },
  { value: 'api', label: 'API' },
  { value: 'dork', label: 'Søkeoperator' },
  { value: 'database', label: 'Database' },
]

const priceFilters: { value: PricingModel; label: string }[] = [
  { value: 'free', label: 'Gratis' },
  { value: 'freemium', label: 'Gratish' },
  { value: 'paid', label: 'Betalt' },
]

const regionFilters = [
  { value: 'NO', label: 'Norge' },
  { value: 'global', label: 'Global' },
  { value: 'SE', label: 'Sverige' },
  { value: 'DK', label: 'Danmark' },
]

const phaseFilters: { value: IntelCyclePhase; label: string }[] = [
  { value: 'collection', label: 'Innsamling' },
  { value: 'analysis', label: 'Analyse' },
  { value: 'processing', label: 'Prosessering' },
  { value: 'planning', label: 'Planlegging' },
  { value: 'dissemination', label: 'Formidling' },
]

export function CommandSearch({
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

    // Søk i verktøytyper
    typeFilters.forEach(tf => {
      if (tf.label.toLowerCase().includes(q) || tf.value.includes(q)) {
        results.push({
          type: 'type',
          value: tf.value,
          label: tf.label,
          matchedOn: 'type'
        })
      }
    })

    // Søk i prismodeller
    priceFilters.forEach(pf => {
      if (pf.label.toLowerCase().includes(q) || pf.value.includes(q)) {
        results.push({
          type: 'price',
          value: pf.value,
          label: pf.label,
          matchedOn: 'pris'
        })
      }
    })

    // Søk i regioner
    regionFilters.forEach(rf => {
      if (rf.label.toLowerCase().includes(q) || rf.value.toLowerCase().includes(q)) {
        results.push({
          type: 'region',
          value: rf.value,
          label: rf.label,
          matchedOn: 'region'
        })
      }
    })

    // Søk i faser
    phaseFilters.forEach(pf => {
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
      // "/" fokuserer søkefeltet
      if (e.key === '/' && document.activeElement !== inputRef.current) {
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
          <kbd className={styles.hint} aria-hidden="true">/</kbd>
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

      {/* Hurtigfiltre når ingen søk er aktivt */}
      {!hasContent && !isExpanded && categories && categories.length > 0 && (
        <div className={styles.quickFilters}>
          {categories.slice(0, 6).map(cat => (
            <button
              key={cat.id}
              type="button"
              className={styles.quickFilter}
              onClick={() => onAddFilter({
                type: 'category',
                value: cat.slug,
                label: t.category[cat.slug as keyof typeof t.category] ?? cat.name
              })}
            >
              {t.category[cat.slug as keyof typeof t.category] ?? cat.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function getFilterTypeLabel(type: FilterType): string {
  switch (type) {
    case 'type': return 'type'
    case 'price': return 'pris'
    case 'region': return 'region'
    case 'phase': return 'fase'
    default: return ''
  }
}
