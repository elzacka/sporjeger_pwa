import { useState } from 'react'
import styles from './DorksGuide.module.css'

export function DorksGuide() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        className={styles.dorksButton}
        onClick={() => setIsOpen(true)}
        aria-label="Google Dorks guide"
        title="Google Dorks"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="7" cy="7" r="4.5" />
          <path d="M10.5 10.5L14 14" />
          <path d="M5 7h4M7 5v4" />
        </svg>
      </button>

      {isOpen && (
        <div className={styles.overlay} onClick={() => setIsOpen(false)}>
          <dialog
            className={styles.modal}
            open
            onClick={e => e.stopPropagation()}
            aria-labelledby="dorks-title"
          >
            <header className={styles.header}>
              <h2 id="dorks-title" className={styles.title}>Google Dorks</h2>
              <button
                type="button"
                className={styles.closeButton}
                onClick={() => setIsOpen(false)}
                aria-label="Lukk"
              >
                x
              </button>
            </header>

            <div className={styles.content}>
              <section className={styles.section}>
                <h3>Hva er Google Dorks?</h3>
                <p>
                  Google Dorks er avanserte søkeoperatorer som lar deg finne informasjon som vanlige søk ikke avdekker. Perfekt for OSINT.
                </p>
              </section>

              <section className={styles.section}>
                <h3>Grunnleggende operatorer</h3>
                <dl className={styles.dorkList}>
                  <dt><code>site:</code></dt>
                  <dd>Søk kun på ett nettsted</dd>
                  <dd className={styles.example}>site:regjeringen.no statsbudsjett</dd>

                  <dt><code>filetype:</code></dt>
                  <dd>Finn spesifikke filtyper</dd>
                  <dd className={styles.example}>filetype:pdf årsrapport 2024</dd>

                  <dt><code>intitle:</code></dt>
                  <dd>Ord må være i sidetittelen</dd>
                  <dd className={styles.example}>intitle:index.of passwords</dd>

                  <dt><code>inurl:</code></dt>
                  <dd>Ord må være i URL-en</dd>
                  <dd className={styles.example}>inurl:admin login</dd>

                  <dt><code>"..."</code></dt>
                  <dd>Eksakt frase</dd>
                  <dd className={styles.example}>"konfidensielt" filetype:pdf</dd>

                  <dt><code>-</code></dt>
                  <dd>Ekskluder ord</dd>
                  <dd className={styles.example}>apple -fruit -iphone</dd>
                </dl>
              </section>

              <section className={styles.section}>
                <h3>Nyttige kombinasjoner</h3>
                <dl className={styles.dorkList}>
                  <dt>Finn eksponerte dokumenter</dt>
                  <dd className={styles.example}>site:*.no filetype:xlsx budget</dd>

                  <dt>Finn innloggingssider</dt>
                  <dd className={styles.example}>site:example.com inurl:login OR inurl:admin</dd>

                  <dt>Finn e-postadresser</dt>
                  <dd className={styles.example}>site:linkedin.com "@bedrift.no"</dd>

                  <dt>Finn CV-er</dt>
                  <dd className={styles.example}>filetype:pdf CV site:*.no</dd>

                  <dt>Finn offentlige mapper</dt>
                  <dd className={styles.example}>intitle:"index of" site:*.no</dd>

                  <dt>Finn webcams</dt>
                  <dd className={styles.example}>inurl:view/view.shtml</dd>
                </dl>
              </section>

              <section className={styles.section}>
                <h3>Norske kilder</h3>
                <dl className={styles.dorkList}>
                  <dt>Offentlige dokumenter</dt>
                  <dd className={styles.example}>site:regjeringen.no OR site:stortinget.no filetype:pdf</dd>

                  <dt>Kommunale saker</dt>
                  <dd className={styles.example}>site:*.kommune.no filetype:pdf saksfremlegg</dd>

                  <dt>Foretaksinfo</dt>
                  <dd className={styles.example}>site:proff.no "daglig leder"</dd>

                  <dt>Domstolsavgjørelser</dt>
                  <dd className={styles.example}>site:lovdata.no dom 2024</dd>
                </dl>
              </section>

              <section className={styles.section}>
                <h3>Tips</h3>
                <ul>
                  <li>Kombiner flere operatorer for presise søk</li>
                  <li>Bruk OR (store bokstaver) for alternativer</li>
                  <li>Bruk * som wildcard i fraser</li>
                  <li>Test søk i inkognitomodus for nøytrale resultater</li>
                </ul>
              </section>
            </div>
          </dialog>
        </div>
      )}
    </>
  )
}
