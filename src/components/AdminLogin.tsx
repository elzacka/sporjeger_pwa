import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import styles from './AdminLogin.module.css'

interface AdminLoginProps {
  onBack: () => void
}

export function AdminLogin({ onBack }: AdminLoginProps) {
  const { signInWithEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim()) return

    setStatus('sending')
    setErrorMessage('')

    const { error } = await signInWithEmail(email)

    if (error) {
      setStatus('error')
      setErrorMessage(error.message)
    } else {
      setStatus('sent')
    }
  }

  if (status === 'sent') {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>Sjekk e-posten din</h1>
          <p className={styles.message}>
            Vi har sendt en innloggingslenke til <strong>{email}</strong>.
          </p>
          <p className={styles.hint}>
            Klikk pa lenken i e-posten for a logge inn.
          </p>
          <button
            type="button"
            className={styles.backButton}
            onClick={() => setStatus('idle')}
          >
            Prov igjen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Admin-innlogging</h1>
        <p className={styles.subtitle}>
          Skriv inn e-postadressen din for a motta en innloggingslenke.
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>
            E-post
            <input
              type="email"
              className={styles.input}
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="din@epost.no"
              required
              autoFocus
              disabled={status === 'sending'}
            />
          </label>

          {status === 'error' && (
            <p className={styles.error}>{errorMessage}</p>
          )}

          <button
            type="submit"
            className={styles.submitButton}
            disabled={status === 'sending' || !email.trim()}
          >
            {status === 'sending' ? 'Sender...' : 'Send innloggingslenke'}
          </button>
        </form>

        <button
          type="button"
          className={styles.backLink}
          onClick={onBack}
        >
          Tilbake til Sporjeger
        </button>
      </div>
    </div>
  )
}
