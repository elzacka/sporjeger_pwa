import { useState } from 'react'
import styles from './HelpGuide.module.css'

export function HelpGuide() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        className={styles.helpButton}
        onClick={() => setIsOpen(true)}
        aria-label="Vis veiledning"
        title="Sporjeger"
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
          <path d="M2 2h12v12H2z" />
          <path d="M5 5h6M5 8h6M5 11h4" />
        </svg>
      </button>

      {isOpen && (
        <div className={styles.overlay} onClick={() => setIsOpen(false)}>
          <dialog
            className={styles.modal}
            open
            onClick={e => e.stopPropagation()}
            aria-labelledby="help-title"
          >
            <header className={styles.header}>
              <h2 id="help-title" className={styles.title}>Veiledning</h2>
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
              <p className={styles.ingress}>
                Katalog med over 1000 OSINT-verktøy for research i åpne kilder.
              </p>
              <p className={styles.footnote}>OSINT = Open Source Intelligence</p>

              <section className={styles.section}>
                <h3>Slik søker du</h3>
                <ul>
                  <li>Trykk <kbd>Ctrl</kbd>+<kbd>K</kbd> eller klikk i søkefelt for å starte søk</li>
                  <li>Klikk på en kategori-knapp for å filtrere</li>
                  <li>Kombiner søk og filtre for finne akkurat det verktøyet du trenger</li>
                  <li>Trykk <kbd>Esc</kbd> for å nullstille</li>
                </ul>
              </section>

              <section className={styles.section}>
                <h3>Badges</h3>
                <div className={styles.badgeList}>
                  <div className={styles.badgeItem}>
                    <span className={`${styles.badge} ${styles.badgeTerminal}`}>Terminal</span>
                    <span>Kommandolinjeverktøy</span>
                  </div>
                  <div className={styles.badgeItem}>
                    <span className={`${styles.badge} ${styles.badgeRegistration}`}>Registrering</span>
                    <span>Krever at du oppretter konto</span>
                  </div>
                  <div className={styles.badgeItem}>
                    <span className={`${styles.badge} ${styles.badgeFreemium}`}>Gratish</span>
                    <span>Gratis med betalte tilleggsfunksjoner</span>
                  </div>
                  <div className={styles.badgeItem}>
                    <span className={`${styles.badge} ${styles.badgePaid}`}>Betalt</span>
                    <span>Krever betaling for bruk</span>
                  </div>
                </div>
              </section>

              <section className={styles.section}>
                <h3>Kjekt å vite</h3>
                <ul>
                  <li>Appen fungerer offline etter første besøk</li>
                  <li>Søk fungerer på norsk og engelsk</li>
                  <li>Klikk på et verktøynavn for å åpne det</li>
                </ul>
              </section>

              <section className={styles.section}>
                <h3>Installer appen</h3>
                <p>Sporjeger kan installeres som app på enheten din:</p>
                <dl className={styles.installList}>
                  <dt>iPhone/iPad</dt>
                  <dd>Trykk Del-knappen, deretter «Legg til på Hjem-skjerm»</dd>

                  <dt>Android</dt>
                  <dd>Trykk menyknappen, deretter «Installer app» eller «Legg til på startskjermen»</dd>

                  <dt>Desktop</dt>
                  <dd>Klikk installasjons-ikonet i adressefeltet (Chrome/Edge)</dd>
                </dl>
              </section>
            </div>
          </dialog>
        </div>
      )}
    </>
  )
}
