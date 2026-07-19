import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from './components/ErrorBoundary'
import App from './App'
// Selvhostede fonter (offline-først, ingen forespørsler til Google)
import '@fontsource/dm-mono/400.css'
import '@fontsource/dm-mono/500.css'
import './styles/index.css'

if ('serviceWorker' in navigator) {
  let reloading = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!reloading) {
      reloading = true
      window.location.reload()
    }
  })
}

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found. Unable to mount React app.')
}

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
)
