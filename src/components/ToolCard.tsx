import { memo } from 'react'
import type { ToolWithCategories } from '@/types/database'
import { t } from '@/lib/i18n'
import styles from './ToolCard.module.css'

interface ToolCardProps {
  tool: ToolWithCategories
}

export const ToolCard = memo(function ToolCard({ tool }: ToolCardProps) {
  // Ekstraher domene fra URL for visning
  const displayUrl = (tool.url ?? '')
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '')

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
        <div className={styles.badges}>
          {tool.tool_type === 'terminal' && (
            <span className={styles.badge} data-type="terminal" title="Terminalverktøy - kjøres i terminal/kommandolinje">
              Terminal
            </span>
          )}
          {tool.requires_registration && (
            <span className={styles.badge} data-type="registration" title="Krever registrering for å bruke">
              Registrering
            </span>
          )}
          {tool.requires_manual_url && (
            <span className={styles.badge} data-type="manual" title="Krever manuell redigering av URL">
              Manuell URL
            </span>
          )}
          {tool.pricing_model && tool.pricing_model !== 'free' && (
            <span
              className={styles.badge}
              data-type={tool.pricing_model}
              title={tool.pricing_model === 'freemium' ? 'Gratis med betalte funksjoner' : 'Betalt tjeneste'}
            >
              {tool.pricing_model === 'freemium' ? 'Gratish' : 'Betalt'}
            </span>
          )}
        </div>
      </div>

      {tool.description && (
        <p className={styles.description}>{tool.description}</p>
      )}

      <div className={styles.footer}>
        <span className={styles.url}>{displayUrl}</span>
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
    </article>
  )
})
