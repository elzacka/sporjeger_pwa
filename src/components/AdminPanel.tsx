import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { ToolType, PricingModel, Platform, IntelCyclePhase } from '@/types/database'
import { TOOL_TYPES, PRICING_MODELS, PLATFORMS, INTEL_PHASES } from '@/constants/filters'
import styles from './AdminPanel.module.css'

interface ToolRow {
  id: string
  name: string
  slug: string
  description: string | null
  url: string
  tool_type: ToolType
  requires_registration: boolean
  requires_manual_url: boolean
  pricing_model: PricingModel
  platforms: Platform[]
  intel_cycle_phases: IntelCyclePhase[]
  regions: string[]
  is_active: boolean
  last_verified: string | null
  guide: string | null
}

interface CategoryRow {
  id: string
  name: string
  slug: string
  description: string | null
}

interface QualityStats {
  total_tools: number
  active_tools: number
  has_good_description: number
  has_phases: number
  verified_count: number
  recently_verified: number
  working_urls: number
  broken_urls: number
  description_pct: number
  url_health_pct: number
  avg_quality_score: number
}

interface QualityIssue {
  id: string
  name: string
  url: string
  issue: string
  severity: string
}

interface AuditEntry {
  id: string
  table_name: string
  record_id: string
  action: string
  changed_fields: string[]
  user_email: string
  created_at: string
  new_data: { name?: string } | null
}

type ViewType = 'search' | 'table' | 'quality' | 'audit'
type TableType = 'tools' | 'categories'

// Input validering - maksimale lengder
const MAX_NAME_LENGTH = 200
const MAX_DESCRIPTION_LENGTH = 2000
const MAX_URL_LENGTH = 500
const MAX_SLUG_LENGTH = 100
const MAX_GUIDE_LENGTH = 10000

interface AdminPanelProps {
  onSignOut?: () => Promise<{ error: Error | null }>
}

export function AdminPanel({ onSignOut }: AdminPanelProps) {
  const [view, setView] = useState<ViewType>('search')
  const [table, setTable] = useState<TableType>('tools')
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<(ToolRow | CategoryRow)[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Record<string, string | boolean | string[] | null>>({})
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  // Kvalitetsdata
  const [qualityStats, setQualityStats] = useState<QualityStats | null>(null)
  const [qualityIssues, setQualityIssues] = useState<QualityIssue[]>([])
  const [isLoadingQuality, setIsLoadingQuality] = useState(false)

  // Audit log
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([])
  const [isLoadingAudit, setIsLoadingAudit] = useState(false)

  // Tabellvisning
  const [allTools, setAllTools] = useState<(ToolRow & { category_slugs: string[]; category_names: string[] })[]>([])
  const [allCategories, setAllCategories] = useState<{ id: string; slug: string; name: string }[]>([])
  const [isLoadingTable, setIsLoadingTable] = useState(false)
  const [tableFilter, setTableFilter] = useState('')
  const [tableSortField, setTableSortField] = useState<string>('name')
  const [tableSortDir, setTableSortDir] = useState<'asc' | 'desc'>('asc')
  const [selectedTools, setSelectedTools] = useState<Set<string>>(new Set())
  const [bulkField, setBulkField] = useState<string>('')
  const [bulkValue, setBulkValue] = useState<string>('')
  const [editingToolId, setEditingToolId] = useState<string | null>(null)
  const [editingField, setEditingField] = useState<string | null>(null)

  // Hent kvalitetsdata
  const loadQualityData = async () => {
    setIsLoadingQuality(true)
    try {
      // Hent statistikk
      const { data: stats } = await supabase
        .from('data_quality_stats')
        .select('*')
        .single()

      if (stats) setQualityStats(stats)

      // Hent problemer
      const { data: issues } = await supabase
        .from('data_quality_issues')
        .select('*')
        .limit(50)

      if (issues) setQualityIssues(issues)
    } catch (err) {
      console.error('Feil ved lasting av kvalitetsdata:', err)
    } finally {
      setIsLoadingQuality(false)
    }
  }

  // Hent audit log
  const loadAuditLog = async () => {
    setIsLoadingAudit(true)
    try {
      const { data } = await supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (data) setAuditLog(data)
    } catch (err) {
      console.error('Feil ved lasting av audit log:', err)
    } finally {
      setIsLoadingAudit(false)
    }
  }

  // Hent alle verktøy for tabellvisning
  const loadTableData = async () => {
    setIsLoadingTable(true)
    try {
      // Hent kategorier
      const { data: cats } = await supabase
        .from('categories')
        .select('id, slug, name')
        .order('name')
      if (cats) setAllCategories(cats)

      // Hent alle verktøy med kategorier
      let tools: typeof allTools = []
      let offset = 0
      while (true) {
        const { data } = await supabase
          .from('tools_with_categories')
          .select('*')
          .range(offset, offset + 999)
        if (!data || data.length === 0) break
        tools = tools.concat(data as typeof allTools)
        offset += 1000
        if (data.length < 1000) break
      }
      setAllTools(tools)
    } catch (err) {
      console.error('Feil ved lasting av tabelldata:', err)
    } finally {
      setIsLoadingTable(false)
    }
  }

  // Oppdater enkeltfelt direkte
  const updateToolField = async (toolId: string, field: string, value: string | boolean | string[]) => {
    setSaveStatus('saving')
    try {
      const { error } = await supabase
        .from('tools')
        .update({ [field]: value })
        .eq('id', toolId)

      if (error) throw error

      // Oppdater lokal state
      setAllTools(prev => prev.map(t =>
        t.id === toolId ? { ...t, [field]: value } : t
      ))
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 1000)
    } catch (err) {
      console.error('Feil ved oppdatering:', err)
      setSaveStatus('error')
    }
    setEditingToolId(null)
    setEditingField(null)
  }

  // Legg til/fjern kategori for verktøy
  const toggleToolCategory = async (toolId: string, categorySlug: string) => {
    const tool = allTools.find(t => t.id === toolId)
    if (!tool) return

    const category = allCategories.find(c => c.slug === categorySlug)
    if (!category) return

    const hasCategory = tool.category_slugs?.includes(categorySlug)

    try {
      if (hasCategory) {
        await supabase
          .from('tool_categories')
          .delete()
          .eq('tool_id', toolId)
          .eq('category_id', category.id)

        setAllTools(prev => prev.map(t =>
          t.id === toolId ? {
            ...t,
            category_slugs: t.category_slugs.filter(s => s !== categorySlug),
            category_names: t.category_names.filter(n => n !== category.name)
          } : t
        ))
      } else {
        await supabase
          .from('tool_categories')
          .insert({ tool_id: toolId, category_id: category.id })

        setAllTools(prev => prev.map(t =>
          t.id === toolId ? {
            ...t,
            category_slugs: [...(t.category_slugs || []), categorySlug],
            category_names: [...(t.category_names || []), category.name]
          } : t
        ))
      }
    } catch (err) {
      console.error('Feil ved kategoriendring:', err)
    }
  }

  // Bulk-oppdatering
  const applyBulkUpdate = async () => {
    if (!bulkField || selectedTools.size === 0) return

    setSaveStatus('saving')
    try {
      let value: string | boolean = bulkValue
      if (bulkField === 'is_active' || bulkField === 'requires_registration' || bulkField === 'requires_manual_url') {
        value = bulkValue === 'true'
      }

      for (const toolId of selectedTools) {
        await supabase
          .from('tools')
          .update({ [bulkField]: value })
          .eq('id', toolId)
      }

      // Oppdater lokal state
      setAllTools(prev => prev.map(t =>
        selectedTools.has(t.id) ? { ...t, [bulkField]: value } : t
      ))

      setSelectedTools(new Set())
      setBulkField('')
      setBulkValue('')
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 1000)
    } catch (err) {
      console.error('Feil ved bulk-oppdatering:', err)
      setSaveStatus('error')
    }
  }

  // Last data basert på view
  useEffect(() => {
    if (view === 'quality') {
      loadQualityData()
    } else if (view === 'audit') {
      loadAuditLog()
    } else if (view === 'table') {
      loadTableData()
    }
  }, [view])

  // Filtrert og sortert verktøyliste for tabellvisning
  const filteredTools = allTools
    .filter(t => {
      if (!tableFilter) return true
      const q = tableFilter.toLowerCase()
      return (t.name?.toLowerCase().includes(q)) ||
        (t.url?.toLowerCase().includes(q)) ||
        (t.description?.toLowerCase().includes(q)) ||
        (Array.isArray(t.category_names) && t.category_names.some(c => c?.toLowerCase().includes(q)))
    })
    .sort((a, b) => {
      const aVal = String((a as unknown as Record<string, unknown>)[tableSortField] ?? '')
      const bVal = String((b as unknown as Record<string, unknown>)[tableSortField] ?? '')
      const cmp = aVal.localeCompare(bVal, 'nb')
      return tableSortDir === 'asc' ? cmp : -cmp
    })

  // Sanitize SQL wildcard characters for ilike queries
  const sanitizeForIlike = (input: string): string => {
    return input
      .replace(/\\/g, '\\\\')
      .replace(/%/g, '\\%')
      .replace(/_/g, '\\_')
  }

  // Søk i valgt tabell
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setIsSearching(true)
    const sanitizedQuery = sanitizeForIlike(searchQuery)

    try {
      if (table === 'tools') {
        const { data, error } = await supabase
          .from('tools')
          .select('id, name, slug, description, url, tool_type, requires_registration, requires_manual_url, pricing_model, platforms, intel_cycle_phases, regions, is_active, last_verified, guide')
          .or(`name.ilike.%${sanitizedQuery}%,description.ilike.%${sanitizedQuery}%`)
          .order('name')
          .limit(50)

        if (error) throw error
        setResults(data ?? [])
      } else {
        const { data, error } = await supabase
          .from('categories')
          .select('id, name, slug, description')
          .or(`name.ilike.%${sanitizedQuery}%,slug.ilike.%${sanitizedQuery}%,description.ilike.%${sanitizedQuery}%`)
          .order('name')
          .limit(50)

        if (error) throw error
        setResults(data ?? [])
      }
    } catch (err) {
      console.error('Søkefeil:', err)
    } finally {
      setIsSearching(false)
    }
  }, [searchQuery, table])

  // Søk ved Enter eller etter 500ms
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch()
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery, table, handleSearch])

  // Start redigering
  const startEditing = (item: ToolRow | CategoryRow) => {
    setEditingId(item.id)
    setEditData({ ...item })
    setSaveStatus('idle')
  }

  // Avbryt redigering
  const cancelEditing = () => {
    setEditingId(null)
    setEditData({})
    setSaveStatus('idle')
  }

  // Lagre endringer
  const saveChanges = async () => {
    if (!editingId) return

    setSaveStatus('saving')

    try {
      // Fjern id fra data som skal oppdateres
      const { id, ...dataToUpdate } = editData

      if (import.meta.env.DEV) {
        console.log('Lagrer til', table, 'med id', editingId, ':', dataToUpdate)
      }

      const { data, error } = await supabase
        .from(table)
        .update(dataToUpdate)
        .eq('id', editingId)
        .select()

      if (import.meta.env.DEV) {
        console.log('Supabase respons:', { data, error })
      }

      if (error) throw error

      setSaveStatus('saved')

      // Oppdater lokale resultater
      setResults(prev => prev.map(item =>
        item.id === editingId ? { ...item, ...editData } as typeof item : item
      ))

      // Lukk redigering og kjør nytt søk for å vise oppdatert data
      setTimeout(() => {
        setEditingId(null)
        setEditData({})
        setSaveStatus('idle')
        handleSearch()
      }, 1000)
    } catch (err) {
      console.error('Lagringsfeil:', err)
      setSaveStatus('error')
    }
  }

  // Oppdater felt i editData
  const updateField = (field: string, value: string | boolean | string[] | null) => {
    setEditData(prev => ({ ...prev, [field]: value }))
  }

  // Toggle verdi i array-felt
  const toggleArrayValue = (field: string, value: string) => {
    const current = (editData[field] as string[]) || []
    const newValue = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value]
    updateField(field, newValue)
  }

  // Tving refresh av hovedappen
  const refreshMainApp = async () => {
    if ('caches' in window) {
      const names = await caches.keys()
      await Promise.all(names.map(name => caches.delete(name)))
    }
    // Behold admin-panel etter refresh
    window.location.href = (import.meta.env.BASE_URL || '/') + '#/admin'
  }

  // Formater dato
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('nb-NO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleSignOut = async () => {
    if (onSignOut) {
      await onSignOut()
      window.location.href = '/'
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Admin</h1>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.refreshButton}
            onClick={refreshMainApp}
            title="Oppdater hovedappen med nye data"
          >
            Oppdater app
          </button>
          {onSignOut && (
            <button
              type="button"
              className={styles.signOutButton}
              onClick={handleSignOut}
            >
              Logg ut
            </button>
          )}
          <a href="/" className={styles.backLink}>Tilbake</a>
        </div>
      </header>

      {/* Navigasjon mellom views */}
      <nav className={styles.nav}>
        <button
          type="button"
          className={`${styles.navButton} ${view === 'search' ? styles.active : ''}`}
          onClick={() => setView('search')}
        >
          Søk og rediger
        </button>
        <button
          type="button"
          className={`${styles.navButton} ${view === 'table' ? styles.active : ''}`}
          onClick={() => setView('table')}
        >
          Tabell
        </button>
        <button
          type="button"
          className={`${styles.navButton} ${view === 'quality' ? styles.active : ''}`}
          onClick={() => setView('quality')}
        >
          Datakvalitet
        </button>
        <button
          type="button"
          className={`${styles.navButton} ${view === 'audit' ? styles.active : ''}`}
          onClick={() => setView('audit')}
        >
          Endringslogg
        </button>
      </nav>

      {/* SØK OG REDIGER VIEW */}
      {view === 'search' && (
        <>
          <div className={styles.controls}>
            <div className={styles.tableSelector}>
              <button
                type="button"
                className={`${styles.tableButton} ${table === 'tools' ? styles.active : ''}`}
                onClick={() => { setTable('tools'); setResults([]); setSearchQuery('') }}
              >
                Verktøy ({table === 'tools' ? results.length : '...'})
              </button>
              <button
                type="button"
                className={`${styles.tableButton} ${table === 'categories' ? styles.active : ''}`}
                onClick={() => { setTable('categories'); setResults([]); setSearchQuery('') }}
              >
                Kategorier
              </button>
            </div>

            <div className={styles.searchBox}>
              <input
                type="text"
                className={styles.searchInput}
                placeholder={`Søk i ${table === 'tools' ? 'verktøy' : 'kategorier'}...`}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
              {isSearching && <span className={styles.spinner}>...</span>}
            </div>
          </div>

          <div className={styles.results}>
            {results.length === 0 && searchQuery && !isSearching && (
              <p className={styles.noResults}>Ingen treff for "{searchQuery}"</p>
            )}

            {results.map(item => (
              <div key={item.id} className={styles.resultItem}>
                {editingId === item.id ? (
                  <div className={styles.editForm}>
                    <div className={styles.editFields}>
                      <label className={styles.editLabel}>
                        Navn:
                        <input
                          type="text"
                          className={styles.editInput}
                          value={String(editData.name ?? '')}
                          onChange={e => updateField('name', e.target.value.slice(0, MAX_NAME_LENGTH))}
                          maxLength={MAX_NAME_LENGTH}
                        />
                      </label>

                      {table === 'tools' && (
                        <>
                          <label className={styles.editLabel}>
                            Slug:
                            <input
                              type="text"
                              className={styles.editInput}
                              value={String(editData.slug ?? '')}
                              onChange={e => updateField('slug', e.target.value.slice(0, MAX_SLUG_LENGTH))}
                              maxLength={MAX_SLUG_LENGTH}
                            />
                          </label>

                          <label className={styles.editLabel}>
                            Beskrivelse:
                            <textarea
                              className={styles.editTextarea}
                              value={String(editData.description ?? '')}
                              onChange={e => updateField('description', e.target.value.slice(0, MAX_DESCRIPTION_LENGTH))}
                              maxLength={MAX_DESCRIPTION_LENGTH}
                              rows={3}
                            />
                          </label>

                          <label className={styles.editLabel}>
                            URL:
                            <input
                              type="text"
                              className={styles.editInput}
                              value={String(editData.url ?? '')}
                              onChange={e => updateField('url', e.target.value.slice(0, MAX_URL_LENGTH))}
                              maxLength={MAX_URL_LENGTH}
                            />
                          </label>

                          <div className={styles.editRow}>
                            <label className={styles.editLabel}>
                              Type:
                              <select
                                className={styles.editSelect}
                                value={String(editData.tool_type ?? 'web')}
                                onChange={e => updateField('tool_type', e.target.value)}
                              >
                                {TOOL_TYPES.map(t => (
                                  <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                              </select>
                            </label>

                            <label className={styles.editLabel}>
                              Prismodell:
                              <select
                                className={styles.editSelect}
                                value={String(editData.pricing_model ?? 'free')}
                                onChange={e => updateField('pricing_model', e.target.value)}
                              >
                                {PRICING_MODELS.map(p => (
                                  <option key={p.value} value={p.value}>{p.label}</option>
                                ))}
                              </select>
                            </label>
                          </div>

                          <div className={styles.checkboxGroup}>
                            <label className={styles.checkboxLabel}>
                              <input
                                type="checkbox"
                                checked={Boolean(editData.is_active)}
                                onChange={e => updateField('is_active', e.target.checked)}
                              />
                              Aktiv
                            </label>
                            <label className={styles.checkboxLabel}>
                              <input
                                type="checkbox"
                                checked={Boolean(editData.requires_registration)}
                                onChange={e => updateField('requires_registration', e.target.checked)}
                              />
                              Krever registrering
                            </label>
                            <label className={styles.checkboxLabel}>
                              <input
                                type="checkbox"
                                checked={Boolean(editData.requires_manual_url)}
                                onChange={e => updateField('requires_manual_url', e.target.checked)}
                              />
                              Krever manuell URL
                            </label>
                          </div>

                          <fieldset className={styles.fieldset}>
                            <legend>Plattformer</legend>
                            <div className={styles.checkboxGrid}>
                              {PLATFORMS.map(p => (
                                <label key={p.value} className={styles.checkboxLabel}>
                                  <input
                                    type="checkbox"
                                    checked={((editData.platforms as string[]) || []).includes(p.value)}
                                    onChange={() => toggleArrayValue('platforms', p.value)}
                                  />
                                  {p.label}
                                </label>
                              ))}
                            </div>
                          </fieldset>

                          <fieldset className={styles.fieldset}>
                            <legend>OSINT-faser</legend>
                            <div className={styles.checkboxGrid}>
                              {INTEL_PHASES.map(p => (
                                <label key={p.value} className={styles.checkboxLabel}>
                                  <input
                                    type="checkbox"
                                    checked={((editData.intel_cycle_phases as string[]) || []).includes(p.value)}
                                    onChange={() => toggleArrayValue('intel_cycle_phases', p.value)}
                                  />
                                  {p.label}
                                </label>
                              ))}
                            </div>
                          </fieldset>

                          <label className={styles.editLabel}>
                            Regioner (kommaseparert):
                            <input
                              type="text"
                              className={styles.editInput}
                              value={((editData.regions as string[]) || []).join(', ')}
                              onChange={e => updateField('regions', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                              placeholder="f.eks. global, europe, norway"
                            />
                          </label>

                          <label className={styles.editLabel}>
                            Sist verifisert:
                            <input
                              type="date"
                              className={styles.editInput}
                              value={editData.last_verified ? String(editData.last_verified).split('T')[0] : ''}
                              onChange={e => updateField('last_verified', e.target.value || null)}
                            />
                          </label>

                          <label className={styles.editLabel}>
                            Tilleggsinfo (Markdown):
                            <textarea
                              className={styles.guideTextarea}
                              value={String(editData.guide ?? '')}
                              onChange={e => updateField('guide', e.target.value.slice(0, MAX_GUIDE_LENGTH) || null)}
                              maxLength={MAX_GUIDE_LENGTH}
                              rows={8}
                              placeholder="## Kom i gang&#10;1. Last ned verktøyet&#10;2. Opprett konto&#10;&#10;**Tips:** Bruk *kursiv* for vektlegging.&#10;&#10;[Lenke til dokumentasjon](https://example.com)"
                            />
                            <span className={styles.charCount}>
                              {(editData.guide as string)?.length ?? 0} / {MAX_GUIDE_LENGTH}
                            </span>
                          </label>
                        </>
                      )}

                      {table === 'categories' && (
                        <>
                          <label className={styles.editLabel}>
                            Slug:
                            <input
                              type="text"
                              className={styles.editInput}
                              value={String(editData.slug ?? '')}
                              onChange={e => updateField('slug', e.target.value)}
                            />
                          </label>
                          <label className={styles.editLabel}>
                            Beskrivelse:
                            <textarea
                              className={styles.editTextarea}
                              value={String(editData.description ?? '')}
                              onChange={e => updateField('description', e.target.value)}
                              rows={2}
                            />
                          </label>
                        </>
                      )}
                    </div>

                    <div className={styles.editActions}>
                      <button
                        type="button"
                        className={styles.saveButton}
                        onClick={saveChanges}
                        disabled={saveStatus === 'saving'}
                      >
                        {saveStatus === 'saving' ? 'Lagrer...' : saveStatus === 'saved' ? 'Lagret!' : 'Lagre'}
                      </button>
                      <button
                        type="button"
                        className={styles.cancelButton}
                        onClick={cancelEditing}
                      >
                        Avbryt
                      </button>
                      {saveStatus === 'error' && (
                        <span className={styles.errorText}>Feil ved lagring</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className={styles.itemContent}>
                    <div className={styles.itemMain}>
                      <strong className={styles.itemName}>{item.name}</strong>
                      {'description' in item && item.description && (
                        <p className={styles.itemDescription}>{item.description}</p>
                      )}
                      {'url' in item && (
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className={styles.itemUrl}>
                          {item.url}
                        </a>
                      )}
                      {'slug' in item && (
                        <span className={styles.itemSlug}>slug: {item.slug}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className={styles.editButton}
                      onClick={() => startEditing(item)}
                    >
                      Rediger
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* TABELLVISNING */}
      {view === 'table' && (
        <div className={styles.tableView}>
          {isLoadingTable ? (
            <p className={styles.loading}>Laster alle verktøy...</p>
          ) : (
            <>
              {/* Kontroller */}
              <div className={styles.tableControls}>
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Filtrer verktøy..."
                  value={tableFilter}
                  onChange={e => setTableFilter(e.target.value)}
                />
                <span className={styles.tableCount}>
                  {filteredTools.length} av {allTools.length} verktøy
                </span>
              </div>

              {/* Bulk-operasjoner */}
              {selectedTools.size > 0 && (
                <div className={styles.bulkControls}>
                  <span>{selectedTools.size} valgt</span>
                  <select
                    className={styles.editSelect}
                    value={bulkField}
                    onChange={e => setBulkField(e.target.value)}
                  >
                    <option value="">Velg felt...</option>
                    <option value="is_active">Status</option>
                    <option value="pricing_model">Pris</option>
                    <option value="requires_registration">Registrering</option>
                    <option value="tool_type">Type</option>
                  </select>
                  {bulkField && (
                    <>
                      {bulkField === 'is_active' || bulkField === 'requires_registration' || bulkField === 'requires_manual_url' ? (
                        <select
                          className={styles.editSelect}
                          value={bulkValue}
                          onChange={e => setBulkValue(e.target.value)}
                        >
                          <option value="">Velg...</option>
                          <option value="true">Ja</option>
                          <option value="false">Nei</option>
                        </select>
                      ) : bulkField === 'pricing_model' ? (
                        <select
                          className={styles.editSelect}
                          value={bulkValue}
                          onChange={e => setBulkValue(e.target.value)}
                        >
                          <option value="">Velg...</option>
                          {PRICING_MODELS.map(p => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                          ))}
                        </select>
                      ) : bulkField === 'tool_type' ? (
                        <select
                          className={styles.editSelect}
                          value={bulkValue}
                          onChange={e => setBulkValue(e.target.value)}
                        >
                          <option value="">Velg...</option>
                          {TOOL_TYPES.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          className={styles.editInput}
                          value={bulkValue}
                          onChange={e => setBulkValue(e.target.value)}
                          placeholder="Ny verdi"
                        />
                      )}
                      <button
                        type="button"
                        className={styles.saveButton}
                        onClick={applyBulkUpdate}
                        disabled={!bulkValue}
                      >
                        Oppdater {selectedTools.size}
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={() => setSelectedTools(new Set())}
                  >
                    Avbryt
                  </button>
                </div>
              )}

              {/* Tabell */}
              <div className={styles.tableWrapper}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th className={styles.checkCol}>
                        <input
                          type="checkbox"
                          checked={selectedTools.size === filteredTools.length && filteredTools.length > 0}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedTools(new Set(filteredTools.map(t => t.id)))
                            } else {
                              setSelectedTools(new Set())
                            }
                          }}
                        />
                      </th>
                      <th
                        className={styles.sortable}
                        onClick={() => {
                          if (tableSortField === 'name') {
                            setTableSortDir(d => d === 'asc' ? 'desc' : 'asc')
                          } else {
                            setTableSortField('name')
                            setTableSortDir('asc')
                          }
                        }}
                      >
                        Navn {tableSortField === 'name' && (tableSortDir === 'asc' ? '^' : 'v')}
                      </th>
                      <th>URL</th>
                      <th
                        className={styles.sortable}
                        onClick={() => {
                          if (tableSortField === 'pricing_model') {
                            setTableSortDir(d => d === 'asc' ? 'desc' : 'asc')
                          } else {
                            setTableSortField('pricing_model')
                            setTableSortDir('asc')
                          }
                        }}
                      >
                        Pris {tableSortField === 'pricing_model' && (tableSortDir === 'asc' ? '^' : 'v')}
                      </th>
                      <th>Reg.</th>
                      <th>Type</th>
                      <th>Aktiv</th>
                      <th>Kategorier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTools.slice(0, 100).map(tool => (
                      <tr key={tool.id} className={!tool.is_active ? styles.inactive : ''}>
                        <td className={styles.checkCol}>
                          <input
                            type="checkbox"
                            checked={selectedTools.has(tool.id)}
                            onChange={e => {
                              const newSet = new Set(selectedTools)
                              if (e.target.checked) {
                                newSet.add(tool.id)
                              } else {
                                newSet.delete(tool.id)
                              }
                              setSelectedTools(newSet)
                            }}
                          />
                        </td>
                        <td className={styles.nameCol}>
                          <strong>{tool.name}</strong>
                          {tool.description && (
                            <span className={styles.descPreview} title={tool.description}>
                              {tool.description.slice(0, 50)}...
                            </span>
                          )}
                        </td>
                        <td className={styles.urlCol}>
                          <a href={tool.url} target="_blank" rel="noopener noreferrer">
                            {tool.url.replace(/^https?:\/\//, '').slice(0, 30)}
                          </a>
                        </td>
                        <td
                          className={styles.clickable}
                          onClick={() => {
                            setEditingToolId(tool.id)
                            setEditingField('pricing_model')
                          }}
                        >
                          {editingToolId === tool.id && editingField === 'pricing_model' ? (
                            <select
                              className={styles.inlineSelect}
                              value={tool.pricing_model}
                              onChange={e => updateToolField(tool.id, 'pricing_model', e.target.value)}
                              onBlur={() => { setEditingToolId(null); setEditingField(null) }}
                              autoFocus
                            >
                              {PRICING_MODELS.map(p => (
                                <option key={p.value} value={p.value}>{p.label}</option>
                              ))}
                            </select>
                          ) : (
                            <span className={styles.badge} data-type={tool.pricing_model}>
                              {tool.pricing_model === 'free' ? 'Gratis' : tool.pricing_model === 'freemium' ? 'Gratish' : 'Betalt'}
                            </span>
                          )}
                        </td>
                        <td
                          className={styles.clickable}
                          onClick={() => updateToolField(tool.id, 'requires_registration', !tool.requires_registration)}
                        >
                          {tool.requires_registration ? 'Ja' : 'Nei'}
                        </td>
                        <td
                          className={styles.clickable}
                          onClick={() => {
                            setEditingToolId(tool.id)
                            setEditingField('tool_type')
                          }}
                        >
                          {editingToolId === tool.id && editingField === 'tool_type' ? (
                            <select
                              className={styles.inlineSelect}
                              value={tool.tool_type}
                              onChange={e => updateToolField(tool.id, 'tool_type', e.target.value)}
                              onBlur={() => { setEditingToolId(null); setEditingField(null) }}
                              autoFocus
                            >
                              {TOOL_TYPES.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                              ))}
                            </select>
                          ) : (
                            tool.tool_type
                          )}
                        </td>
                        <td
                          className={styles.clickable}
                          onClick={() => updateToolField(tool.id, 'is_active', !tool.is_active)}
                        >
                          {tool.is_active ? 'Ja' : 'Nei'}
                        </td>
                        <td className={styles.categoriesCol}>
                          <div className={styles.categoryTags}>
                            {tool.category_names?.map(cat => (
                              <span
                                key={cat}
                                className={styles.categoryTag}
                                onClick={() => {
                                  const slug = allCategories.find(c => c.name === cat)?.slug
                                  if (slug) toggleToolCategory(tool.id, slug)
                                }}
                                title="Klikk for å fjerne"
                              >
                                {cat} x
                              </span>
                            ))}
                            <select
                              className={styles.addCategorySelect}
                              value=""
                              onChange={e => {
                                if (e.target.value) {
                                  toggleToolCategory(tool.id, e.target.value)
                                }
                              }}
                            >
                              <option value="">+</option>
                              {allCategories
                                .filter(c => !tool.category_slugs?.includes(c.slug))
                                .map(c => (
                                  <option key={c.id} value={c.slug}>{c.name}</option>
                                ))}
                            </select>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredTools.length > 100 && (
                <p className={styles.tableNote}>Viser 100 av {filteredTools.length} verktøy. Bruk filter for å se flere.</p>
              )}
            </>
          )}
        </div>
      )}

      {/* DATAKVALITET VIEW */}
      {view === 'quality' && (
        <div className={styles.qualityView}>
          {isLoadingQuality ? (
            <p className={styles.loading}>Laster kvalitetsdata...</p>
          ) : (
            <>
              {/* Statistikk-kort */}
              {qualityStats && (
                <div className={styles.statsGrid}>
                  <div className={styles.statCard}>
                    <span className={styles.statValue}>{qualityStats.total_tools}</span>
                    <span className={styles.statLabel}>Totalt verktøy</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statValue}>{qualityStats.active_tools}</span>
                    <span className={styles.statLabel}>Aktive</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statValue}>{qualityStats.description_pct ?? 0}%</span>
                    <span className={styles.statLabel}>Har beskrivelse</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statValue}>{qualityStats.has_phases}</span>
                    <span className={styles.statLabel}>Har OSINT-faser</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statValue}>{qualityStats.working_urls}</span>
                    <span className={styles.statLabel}>Fungerende URLer</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statValue}>{qualityStats.broken_urls}</span>
                    <span className={styles.statLabel}>Døde lenker</span>
                  </div>
                </div>
              )}

              {/* Kvalitetsproblemer */}
              <h2 className={styles.sectionTitle}>Kvalitetsproblemer ({qualityIssues.length})</h2>
              {qualityIssues.length === 0 ? (
                <p className={styles.noIssues}>Ingen kvalitetsproblemer funnet. Kjør database-improvements.sql for å aktivere views.</p>
              ) : (
                <div className={styles.issuesList}>
                  {qualityIssues.map(issue => (
                    <div key={issue.id} className={`${styles.issueItem} ${styles[issue.severity]}`}>
                      <div className={styles.issueMain}>
                        <strong>{issue.name}</strong>
                        <span className={styles.issueBadge}>{issue.issue}</span>
                      </div>
                      <a href={issue.url} target="_blank" rel="noopener noreferrer" className={styles.issueUrl}>
                        {issue.url}
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ENDRINGSLOGG VIEW */}
      {view === 'audit' && (
        <div className={styles.auditView}>
          {isLoadingAudit ? (
            <p className={styles.loading}>Laster endringslogg...</p>
          ) : auditLog.length === 0 ? (
            <p className={styles.noResults}>Ingen endringer logget ennå. Kjør database-improvements.sql for å aktivere logging.</p>
          ) : (
            <div className={styles.auditList}>
              {auditLog.map(entry => (
                <div key={entry.id} className={styles.auditItem}>
                  <div className={styles.auditHeader}>
                    <span className={`${styles.auditAction} ${styles[entry.action.toLowerCase()]}`}>
                      {entry.action}
                    </span>
                    <span className={styles.auditTable}>{entry.table_name}</span>
                    <span className={styles.auditTime}>{formatDate(entry.created_at)}</span>
                  </div>
                  <div className={styles.auditDetails}>
                    <span className={styles.auditName}>
                      {entry.new_data?.name ?? entry.record_id.slice(0, 8)}
                    </span>
                    {entry.changed_fields && entry.changed_fields.length > 0 && (
                      <span className={styles.auditFields}>
                        Endret: {entry.changed_fields.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
