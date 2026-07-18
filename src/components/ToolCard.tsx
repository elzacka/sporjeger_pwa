import { memo, useState } from 'react'
import type { ToolWithCategories } from '@/types/database'
import { t } from '@/lib/i18n'
import { Markdown } from './Markdown'
import styles from './ToolCard.module.css'

interface ToolCardProps {
  tool: ToolWithCategories
}

export const ToolCard = memo(function ToolCard({ tool }: ToolCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [pinned, setPinned] = useState(false)

  // Ekstraher domene fra URL for visning
  const displayUrl = (tool.url ?? '')
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '')

  const hasGuide = tool.guide && tool.guide.trim().length > 0

  // Klikk hvor som helst i guiden lukker den, men ikke når den er låst (pin)
  // og ikke når klikket er på en lenke.
  const handleGuideClick = (e: React.MouseEvent) => {
    if (pinned) return
    if ((e.target as HTMLElement).closest('a')) return
    setIsExpanded(false)
  }

  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.name}>
          <a
            href={tool.url ?? '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
            aria-label={`${tool.name} (åpnes i nytt vindu)`}
          >
            {tool.name}
          </a>
        </h2>
        <div className={styles.tags}>
          {tool.tool_type === 'terminal' && (
            <span className={styles.tag} data-type="terminal" title="Terminalverktøy - kjøres i terminal/kommandolinje">
              Terminal
            </span>
          )}
          {tool.requires_registration && (
            <span className={styles.tag} data-type="registration" title="Krever registrering for å bruke">
              Registrering
            </span>
          )}
          {tool.requires_manual_url && (
            <span className={styles.tag} data-type="manual" title="Krever manuell redigering av URL">
              Manuell URL
            </span>
          )}
          {tool.pricing_model && tool.pricing_model !== 'free' && (
            <span
              className={styles.tag}
              data-type={tool.pricing_model}
              title={tool.pricing_model === 'freemium' ? 'Gratis med betalte funksjoner' : 'Betalt tjeneste'}
            >
              {tool.pricing_model === 'freemium' ? 'Gratish' : 'Betalt'}
            </span>
          )}
          {tool.caution_level === 1 && (
            <span
              className={styles.caution}
              title="Dette verktøyet krever ekstra bevissthet om rettslig grunnlag og etikk."
            >
              !
            </span>
          )}
        </div>
      </div>

      {tool.description && (
        <p className={styles.description}>{tool.description}</p>
      )}

      <div className={styles.footer}>
        {!hasGuide && <span className={styles.url}>{displayUrl}</span>}
        {tool.category_slugs && tool.category_slugs.length > 0 && (
          <span className={styles.categories}>
            {tool.category_slugs
              .filter(slug => slug != null)
              .map(slug => t.category[slug as keyof typeof t.category] ?? slug)
              .slice(0, 3)
              .join(' · ')}
          </span>
        )}
      </div>

      {hasGuide && (
        <>
          <button
            type="button"
            className={styles.expandButton}
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
            aria-controls={`guide-${tool.id}`}
            aria-label={isExpanded ? 'Skjul' : 'Vis mer'}
            title={isExpanded ? 'Skjul' : 'Vis mer'}
          >
            <svg width="20" height="20" viewBox="0 -960 960 960" fill="currentColor" aria-hidden="true">
              <path d={isExpanded
                ? 'm283-345-43-43 240-240 240 239-43 43-197-197-197 198Z'
                : 'M480-345 240-585l43-43 197 198 197-197 43 43-240 239Z'} />
            </svg>
          </button>

          {isExpanded && (
            <div
              id={`guide-${tool.id}`}
              className={styles.guide}
              onClick={handleGuideClick}
            >
              <button
                type="button"
                className={`${styles.pin} ${pinned ? styles.pinActive : ''}`}
                onClick={(e) => { e.stopPropagation(); setPinned(p => !p) }}
                aria-pressed={pinned}
                aria-label={pinned ? 'Lås opp guiden' : 'Lås guiden åpen'}
                title={pinned
                  ? 'Låst åpen. Klikk for å slå på lukking igjen.'
                  : 'Lås åpen så du kan markere og kopiere tekst uten at den lukkes.'}
              >
                <svg width="16" height="16" viewBox="0 -960 960 960" fill="currentColor" aria-hidden="true">
                  <path d="m254-80-30-30v-173H80v-68l62-111v-112H80v-60h348v60h-62v112l62 111v68H284v173l-30 30Zm237-80v-60h329v-520H80q0-25 17.63-42.5Q115.25-800 140-800h680q24 0 42 18t18 42v520q0 24-18 42t-42 18H491ZM144-343h219l-57-102v-129H202v129l-58 102Zm110 0Z" />
                </svg>
              </button>
              <span className={styles.guideUrl}>{displayUrl}</span>
              <Markdown content={tool.guide!} />
            </div>
          )}
        </>
      )}
    </article>
  )
})
