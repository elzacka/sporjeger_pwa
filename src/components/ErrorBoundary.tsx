import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary fanget feil:', error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: '#F4F1EA',
          color: '#2C2C2C',
          fontFamily: '"DM Mono", monospace'
        }}>
          <h1 style={{ marginBottom: '1rem' }}>Noe gikk galt</h1>
          <p style={{ marginBottom: '1.5rem', color: '#666' }}>
            En uventet feil oppstod. Prov a laste siden pa nytt.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#1a5f7a',
              color: '#F4F1EA',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1rem',
              fontFamily: '"DM Mono", monospace'
            }}
          >
            Last siden pa nytt
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
