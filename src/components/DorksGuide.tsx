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
                  <dd className={styles.example}>site:vg.no fotball</dd>

                  <dt><code>site:</code></dt>
                  <dd>Begge ordene må finnes på samme side, kun .no-domener</dd>
                  <dd className={styles.example}>site:.no ("Storybook" OR "storybook") "designsystem"l</dd>

                  <dt><code>filetype:</code></dt>
                  <dd>Finn spesifikke filtyper</dd>
                  <dd className={styles.example}>filetype:pdf oppskrift</dd>

                  <dt><code>intitle:</code></dt>
                  <dd>Ord må være i sidetittelen</dd>
                  <dd className={styles.example}>intitle:guide fjelltur</dd>

                  <dt><code>inurl:</code></dt>
                  <dd>Ord må være i URL-en</dd>
                  <dd className={styles.example}>inurl:blog reise norge</dd>

                  <dt><code>"..."</code></dt>
                  <dd>Eksakt frase</dd>
                  <dd className={styles.example}>"beste kaffebrenneri oslo"</dd>

                  <dt><code>-</code></dt>
                  <dd>Ekskluder ord</dd>
                  <dd className={styles.example}>jaguar -bil -car</dd>
                </dl>
              </section>

              <section className={styles.section}>
                <h3>Nyttige kombinasjoner</h3>
                <dl className={styles.dorkList}>
                  <dt>Søk i flere nettaviser</dt>
                  <dd className={styles.example}>site:vg.no OR site:nrk.no OR site:dagbladet.no tema</dd>

                  <dt>Finn presentasjoner</dt>
                  <dd className={styles.example}>filetype:pptx OR filetype:pdf "presentasjon"</dd>

                  <dt>Finn kontaktinfo</dt>
                  <dd className={styles.example}>site:linkedin.com "jobbtittel" "oslo"</dd>

                  <dt>Finn diskusjoner</dt>
                  <dd className={styles.example}>site:reddit.com OR site:quora.com søkeord</dd>

                  <dt>Søk i fora</dt>
                  <dd className={styles.example}>inurl:forum OR inurl:thread søkeord</dd>

                  <dt>Finn bilder med info</dt>
                  <dd className={styles.example}>intitle:"index of" dcim</dd>
                </dl>
              </section>

              <section className={styles.section}>
                <h3>Research-eksempler</h3>
                <dl className={styles.dorkList}>
                  <dt>Finn selskapsinfo</dt>
                  <dd className={styles.example}>site:proff.no "firmanavn"</dd>

                  <dt>Finn nyhetsarkiv</dt>
                  <dd className={styles.example}>site:nrk.no "2020..2024" søkeord</dd>

                  <dt>Finn akademiske kilder</dt>
                  <dd className={styles.example}>site:uio.no OR site:ntnu.no filetype:pdf</dd>

                  <dt>Finn sosiale profiler</dt>
                  <dd className={styles.example}>site:twitter.com OR site:instagram.com "brukernavn"</dd>
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
