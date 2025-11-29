import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import styles from './AdminPanel.module.css'

interface ToolRow {
  id: string
  name: string
  description: string | null
  url: string
  tool_type: string
  pricing_model: string
  is_active: boolean
}

interface CategoryRow {
  id: string
  name: string
  slug: string
  description: string | null
}

type TableType = 'tools' | 'categories'

export function AdminPanel() {
  const [table, setTable] = useState<TableType>('tools')
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<(ToolRow | CategoryRow)[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Record<string, string | boolean | null>>({})
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

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
          .select('id, name, description, url, tool_type, pricing_model, is_active')
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
      const { error } = await supabase
        .from(table)
        .update(editData)
        .eq('id', editingId)

      if (error) throw error

      setSaveStatus('saved')

      // Oppdater lokale resultater
      setResults(prev => prev.map(item =>
        item.id === editingId ? { ...item, ...editData } as typeof item : item
      ))

      // Lukk redigering etter kort pause
      setTimeout(() => {
        setEditingId(null)
        setEditData({})
        setSaveStatus('idle')
      }, 1000)
    } catch (err) {
      console.error('Lagringsfeil:', err)
      setSaveStatus('error')
    }
  }

  // Oppdater felt i editData
  const updateField = (field: string, value: string | boolean) => {
    setEditData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Admin</h1>
        <a href="/" className={styles.backLink}>Tilbake til Sporjeger</a>
      </header>

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
              // Redigeringsmodus
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
              // Visningsmodus
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
    </div>
  )
}
