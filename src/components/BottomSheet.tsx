import { useEffect, useRef, useState, type ReactNode } from 'react'
import styles from './BottomSheet.module.css'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [dragOffset, setDragOffset] = useState(0)
  const dragStartY = useRef<number | null>(null)

  // Åpne/lukke via native dialog-API - gir fokusfelle, ::backdrop og aria-modal gratis
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen && !dialog.open) {
      dialog.showModal()
      setDragOffset(0)
    } else if (!isOpen && dialog.open) {
      dialog.close()
    }
  }, [isOpen])

  // Escape: håndteres i capture-fasen på document slik at den stoppes FØR
  // CommandSearch sin document-lytter, som ellers ville nullstilt søk/filtre.
  // (React sin syntetiske stopPropagation når ikke native document-lyttere.)
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
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Klikk på backdrop (utenfor selve arket) lukker
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      onClose()
    }
  }

  // Sveip ned for å lukke (kun berøring, mobil)
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
    if (dragOffset > 100) {
      onClose()
    }
    setDragOffset(0)
    dragStartY.current = null
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.sheet}
      onClick={handleBackdropClick}
      aria-labelledby="sheet-title"
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
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      </header>
      <div className={styles.content}>
        {children}
      </div>
    </dialog>
  )
}
