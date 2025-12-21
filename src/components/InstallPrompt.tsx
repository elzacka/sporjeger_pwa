import { useState, useEffect } from 'react'
import styles from './InstallPrompt.module.css'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// Debug-modus: sett til true for å teste prompten under utvikling
const DEBUG_SHOW_PROMPT = import.meta.env.DEV && false

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [showDebug, setShowDebug] = useState(DEBUG_SHOW_PROMPT)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowDebug(false) // Skjul debug når ekte event kommer
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (showDebug) {
      // Debug-modus: lukk prompten
      setShowDebug(false)
      return
    }
    if (!deferredPrompt) return

    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    setShowDebug(false)
  }

  if ((!deferredPrompt && !showDebug) || dismissed) {
    return null
  }

  return (
    <div className={styles.prompt} role="dialog" aria-labelledby="install-prompt-title">
      <div className={styles.title} id="install-prompt-title">
        Installer Sporjeger
      </div>
      <p className={styles.description}>
        For raskere tilgang og offline-bruk.
      </p>
      <div className={styles.actions}>
        <button className={styles.installBtn} onClick={handleInstall}>
          Installer
        </button>
        <button className={styles.dismissBtn} onClick={handleDismiss}>
          Ikke nå
        </button>
      </div>
    </div>
  )
}
