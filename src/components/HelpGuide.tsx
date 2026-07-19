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
          <div className={styles.tagGrid}>
            <div><span className={styles.tag} style={{ background: '#6B705C', color: '#F4F1EA' }}>Terminal</span></div>
            <div>Kjøres via kommandolinjen</div>

            <div><span className={styles.tag} style={{ background: '#9B2915', color: '#F4F1EA' }}>Registrering</span></div>
            <div>Krever at du lager en konto</div>

            <div><span className={styles.tag} style={{ background: '#7B6D4D', color: '#F4F1EA' }}>Gratish</span></div>
            <div>Gratis, med betalte tillegg</div>

            <div><span className={styles.tag} style={{ background: '#9B2915', color: '#F4F1EA' }}>Betalt</span></div>
            <div>Koster penger å bruke</div>

            <div><span className={styles.tag} style={{ background: '#f5a623', color: '#7a5200' }}>!</span></div>
            <div>Vær ekstra varsom (lov/etikk)</div>
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
