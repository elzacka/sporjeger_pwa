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
  const dragStartY = useRef<number | null>(null)

  // Escape i capture-fasen slik at den stoppes FØR CommandSearch sin lytter
  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape, true)
    return () => document.removeEventListener('keydown', handleEscape, true)
  }, [isOpen, onClose])

  // Lås bakgrunnsscroll mens arket er åpent
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Sveip ned for å lukke
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    if (touch) dragStartY.current = touch.clientY
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragStartY.current === null) return
    const touch = e.touches[0]
    if (!touch) return
    const delta = touch.clientY - dragStartY.current
    if (delta > 0) setDragOffset(delta)
  }

  const handleTouchEnd = () => {
    if (dragOffset > 100) onClose()
    setDragOffset(0)
    dragStartY.current = null
  }

  return (
    <>
      <div
        className={`${styles.backdrop} ${isOpen ? styles.backdropOpen : ''}`}
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
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className={styles.handle} aria-hidden="true" />
          <h2 id="sheet-title" className={styles.title}>{title}</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Lukk"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </header>
        <div className={styles.content}>
          {children}
        </div>
      </div>
    </>
  )
}
