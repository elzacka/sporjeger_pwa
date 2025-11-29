import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { ToolType, PricingModel, Platform, IntelCyclePhase } from '@/types/database'
import styles from './AdminPanel.module.css'

// Dropdown-valg
const TOOL_TYPES: { value: ToolType; label: string }[] = [
  { value: 'web', label: 'Web' },
  { value: 'terminal', label: 'Terminal' },
  { value: 'desktop', label: 'Desktop' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'browser_extension', label: 'Nettleserutvidelse' },
  { value: 'api', label: 'API' },
  { value: 'dork', label: 'Dork' },
  { value: 'database', label: 'Database' },
]

const PRICING_MODELS: { value: PricingModel; label: string }[] = [
  { value: 'free', label: 'Gratis' },
  { value: 'freemium', label: 'Gratish' },
  { value: 'paid', label: 'Betalt' },
]

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: 'web', label: 'Web' },
  { value: 'windows', label: 'Windows' },
  { value: 'macos', label: 'macOS' },
  { value: 'linux', label: 'Linux' },
  { value: 'android', label: 'Android' },
  { value: 'ios', label: 'iOS' },
]

const INTEL_PHASES: { value: IntelCyclePhase; label: string }[] = [
  { value: 'planning', label: 'Planlegging' },
  { value: 'collection', label: 'Innsamling' },
  { value: 'processing', label: 'Prosessering' },
  { value: 'analysis', label: 'Analyse' },
  { value: 'dissemination', label: 'Distribusjon' },
]

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

type ViewType = 'search' | 'quality' | 'audit'
type TableType = 'tools' | 'categories'

export function AdminPanel() {
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

  // Last data basert pa view
  useEffect(() => {
    if (view === 'quality') {
      loadQualityData()
    } else if (view === 'audit') {
      loadAuditLog()
    }
  }, [view])

  // Sok i valgt tabell
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setIsSearching(true)

    try {
      if (table === 'tools') {
        const { data, error } = await supabase
          .from('tools')
          .select('id, name, slug, description, url, tool_type, requires_registration, requires_manual_url, pricing_model, platforms, intel_cycle_phases, regions, is_active, last_verified')
          .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
          .order('name')
          .limit(50)

        if (error) throw error
        setResults(data ?? [])
      } else {
        const { data, error } = await supabase
          .from('categories')
          .select('id, name, slug, description')
          .or(`name.ilike.%${searchQuery}%,slug.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
          .order('name')
          .limit(50)

        if (error) throw error
        setResults(data ?? [])
      }
    } catch (err) {
      console.error('Sokefeil:', err)
    } finally {
      setIsSearching(false)
    }
  }

  // Sok ved Enter eller etter 500ms
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch()
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery, table])

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

      console.log('Lagrer til', table, 'med id', editingId, ':', dataToUpdate)

      const { data, error } = await supabase
        .from(table)
        .update(dataToUpdate)
        .eq('id', editingId)
        .select()

      console.log('Supabase respons:', { data, error })

      if (error) throw error

      setSaveStatus('saved')

      // Oppdater lokale resultater
      setResults(prev => prev.map(item =>
        item.id === editingId ? { ...item, ...editData } as typeof item : item
      ))

      // Lukk redigering og kjor nytt sok for a vise oppdatert data
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
  const refreshMainApp = () => {
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name))
      })
    }
    window.location.href = '/'
    window.location.reload()
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
          Sok og rediger
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

      {/* SOK OG REDIGER VIEW */}
      {view === 'search' && (
        <>
          <div className={styles.controls}>
            <div className={styles.tableSelector}>
              <button
                type="button"
                className={`${styles.tableButton} ${table === 'tools' ? styles.active : ''}`}
                onClick={() => { setTable('tools'); setResults([]); setSearchQuery('') }}
              >
                Verktoy ({table === 'tools' ? results.length : '...'})
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
                placeholder={`Sok i ${table === 'tools' ? 'verktoy' : 'kategorier'}...`}
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
                          onChange={e => updateField('name', e.target.value)}
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
                              onChange={e => updateField('slug', e.target.value)}
                            />
                          </label>

                          <label className={styles.editLabel}>
                            Beskrivelse:
                            <textarea
                              className={styles.editTextarea}
                              value={String(editData.description ?? '')}
                              onChange={e => updateField('description', e.target.value)}
                              rows={3}
                            />
                          </label>

                          <label className={styles.editLabel}>
                            URL:
                            <input
                              type="text"
                              className={styles.editInput}
                              value={String(editData.url ?? '')}
                              onChange={e => updateField('url', e.target.value)}
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
                    <span className={styles.statLabel}>Totalt verktoy</span>
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
                    <span className={styles.statLabel}>Dode lenker</span>
                  </div>
                </div>
              )}

              {/* Kvalitetsproblemer */}
              <h2 className={styles.sectionTitle}>Kvalitetsproblemer ({qualityIssues.length})</h2>
              {qualityIssues.length === 0 ? (
                <p className={styles.noIssues}>Ingen kvalitetsproblemer funnet. Kjor database-improvements.sql for a aktivere views.</p>
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
            <p className={styles.noResults}>Ingen endringer logget enna. Kjor database-improvements.sql for a aktivere logging.</p>
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
