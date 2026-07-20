import { useState } from 'react'
import { BottomSheet } from './BottomSheet'
import styles from './HelpGuide.module.css'

export function HelpGuide() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        className={styles.helpButton}
        onClick={() => setIsOpen(true)}
        aria-label="Vis guide"
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
          aria-hidden="true"
        >
          <path d="M2 2h12v12H2z" />
          <path d="M5 5h6M5 8h6M5 11h4" />
        </svg>
        <span className={styles.helpLabel}>Guide</span>
      </button>

      <BottomSheet isOpen={isOpen} onClose={() => setIsOpen(false)} title="Guide">
        <p className={styles.ingress}>
          Sporjeger er en katalog med verktøy for å finne informasjon i åpne kilder. Også kalt OSINT (Open Source Intelligence).
        </p>

        <aside className={styles.disclaimer}>
          <p>Du er selv ansvarlig for lovlig og etisk bruk.</p>
          <p>At noe er offentlig, betyr ikke at det er fritt frem.</p>
        </aside>

        <section className={styles.section}>
          <h3>Slik søker du og bruker filtrene</h3>
          <ul>
            <li>Bruk søk og filtrering hver for seg eller kombinert</li>
            <li>Klikk i søkefeltet, eller trykk <kbd>Ctrl</kbd>+<kbd>K</kbd></li>
            <li>Velg en kategori for å filtrere</li>
            <li>Trykk <kbd>Esc</kbd> for å nullstille</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h3>Verktøyetiketter</h3>
          <div className={styles.badgeList}>
            <div className={styles.badgeRow}>
              <span className={`${styles.badge} ${styles.badgeTerminal}`}>Terminal</span>
              <span className={styles.badgeDesc}>Kjøres via kommandolinjen</span>
            </div>
            <div className={styles.badgeRow}>
              <span className={`${styles.badge} ${styles.badgeRegistration}`}>Registrering</span>
              <span className={styles.badgeDesc}>Krever at du lager en konto</span>
            </div>
            <div className={styles.badgeRow}>
              <span className={`${styles.badge} ${styles.badgeFreemium}`}>Gratish</span>
              <span className={styles.badgeDesc}>Gratis, med betalte tillegg</span>
            </div>
            <div className={styles.badgeRow}>
              <span className={`${styles.badge} ${styles.badgePaid}`}>Betalt</span>
              <span className={styles.badgeDesc}>Koster penger å bruke</span>
            </div>
            <div className={styles.badgeRow}>
              <span className={`${styles.badge} ${styles.badgeCaution}`}>!</span>
              <span className={styles.badgeDesc}>Vær ekstra varsom (lov/etikk)</span>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h3>Kjekt å vite</h3>
          <ul>
            <li>Du kan søke på norsk og engelsk</li>
            <li>Du kan søke på alt i katalogen – også beskrivelsene</li>
            <li>Klikk på et verktøynavn for å åpne verktøyet</li>
            <li>Appen virker uten nett etter første besøk</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h3>Installer appen</h3>
          <dl className={styles.installList}>
            <dt>iPhone/iPad</dt>
            <dd>Del-knappen, så «Legg til på Hjem-skjerm»</dd>

            <dt>Android</dt>
            <dd>Menyknappen, så «Installer app»</dd>

            <dt>PC/Mac</dt>
            <dd>Installer-ikonet i adressefeltet (Chrome/Edge)</dd>
          </dl>
        </section>
      </BottomSheet>
    </>
  )
}
