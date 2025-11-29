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
        title="Veiledning"
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
              <section className={styles.section}>
                <h3>Hva er Sporjeger?</h3>
                <p>
                  Sporjeger er en katalog med over 1000 OSINT-verktøy (Open Source Intelligence). For det du ønsker å finne eller finne ut av blant åpne kilder på nett.
                </p>
              </section>

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
                <dl className={styles.badgeList}>
                  <dt><span className={styles.badge} data-type="terminal">Terminal</span></dt>
                  <dd>Kommandolinjeverktøy</dd>

                  <dt><span className={styles.badge} data-type="registration">Registrering</span></dt>
                  <dd>Krever at du oppretter konto</dd>

                  <dt><span className={styles.badge} data-type="freemium">Gratish</span></dt>
                  <dd>Gratis med betalte tilleggsfunksjoner</dd>

                  <dt><span className={styles.badge} data-type="paid">Betalt</span></dt>
                  <dd>Krever betaling for bruk</dd>
                </dl>
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
