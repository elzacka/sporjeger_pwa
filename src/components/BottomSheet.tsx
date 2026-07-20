import { useEffect, useRef, useState, type ReactNode } from 'react'
import styles from './BottomSheet.module.css'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  const [dragOffset, setDragOffset] = useState(0)
  const startY = useRef<number | null>(null)

  // Escape lukker arket uten å nullstille søk/filtre i CommandSearch
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); onClose() }
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [isOpen, onClose])

  // Lås bakgrunnsscroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Sveip ned for å lukke (mobil)
  const onTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0]?.clientY ?? null
  }
  const onTouchMove = (e: React.TouchEvent) => {
    if (startY.current === null) return
    const delta = (e.touches[0]?.clientY ?? 0) - startY.current
    if (delta > 0) setDragOffset(delta)
  }
  const onTouchEnd = () => {
    if (dragOffset > 100) onClose()
    setDragOffset(0)
    startY.current = null
  }

  return (
    <>
      <div
        className={`${styles.backdrop} ${isOpen ? styles.backdropVisible : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        className={`${styles.sheet} ${isOpen ? styles.sheetOpen : ''}`}
        style={dragOffset > 0 ? { transform: `translateY(${dragOffset}px)`, transition: 'none' } : undefined}
      >
        <header
          className={styles.header}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Kun på mobil */}
          <div className={styles.handle} aria-hidden="true" />

          <h2 id="sheet-title" className={styles.title}>{title}</h2>

          {/* Kun på desktop */}
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Lukk"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </header>

        <div className={styles.body}>
          {children}
        </div>
      </div>
    </>
  )
}
