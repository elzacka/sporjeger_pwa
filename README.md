# Sporjeger

Norsk OSINT-katalog med over 350 verktøy for å finne informasjon i åpne kilder. Minimalistisk PWA.

**Live:** https://elzacka.github.io/sporjeger_pwa/

## Om appen

Appen er et oppslagsverk uten innlogging eller skriving.
Databasen i Supabase vedlikeholdes automatisk:

- Et "team" med KI-agenter i Claude kombinert med en serie scheduled tasks
- De synkroniserer mot Bellingcat Toolkit, kontrollerer kvalitet, sjekker lenker og oversetter beskrivelser til norsk klarspråk

## Funksjoner

- Fuzzy-søk med naturlig språk
- Kategori- og filterbasert navigering (fase, kategori, type, pris, region)
- Alltid synlig teller for totalt antall verktøy
- Offline-støtte via Service Worker
- Tastatursnarvei: `Ctrl+K` flytter markør til søkefelt, `Esc` nullstiller
- Guide i "bottom sheet"
- Kan installeres som app (PWA)
- Markdown-baserte verktøyguider med kodeblokker og klikkbare URL-er
- Varselsindikator for verktøy som krever ekstra bevissthet om rettslig grunnlag

## Teknologi

- React 19.2 + TypeScript 7.0
- Vite 8.1 + vite-plugin-pwa 1.3
- Supabase JS 2.110 (database, kun lesetilgang)
- Fuse.js 7.5 (fuzzy-søk)
- Fonter og ikoner ligger lokalt (ingen eksterne CDN-er)

## Oppsett

```bash
npm install
```

Lag `.env.local`:

```
VITE_SUPABASE_URL=https://din-prosjekt-id.supabase.co
VITE_SUPABASE_ANON_KEY=din-anon-key
```

```bash
npm run dev      # Utviklingsserver på http://localhost:5174/sporjeger_pwa/
npm run build    # Typesjekk + produksjonsbygg i dist/
npm run preview  # Forhåndsvis produksjonsbygg
```

## Publisering

Når du pusher til `main`, kjører `.github/workflows/deploy.yml` som bygger og publiserer til GitHub Pages. Miljøvariablene over ligger som repository secrets.

## Struktur

```
src/
├── components/     # React-komponenter (ToolCard, CommandSearch, Markdown, ...)
├── hooks/          # Custom hooks (useTools, useSearch, useFilters)
├── lib/            # Supabase-klient, i18n
├── constants/      # Filterkonstanter
├── styles/         # Global CSS
└── types/          # TypeScript-typer
```

## Kilder og kreditering

Mange av verktøybeskrivelsene i Sporjeger bygger på **Bellingcats Online Investigation Toolkit**, en dugnadsbasert verktøykatalog fra den ideelle organisasjonen Bellingcat. Takk til Bellingcat og bidragsyterne deres.

- Katalog: https://bellingcat.gitbook.io/toolkit
- Bellingcat: https://www.bellingcat.com
- Lisens: se [Bellingcats egne vilkår](https://github.com/bellingcat/toolkit)

Katalogen inneholder også verktøy som ikke finnes hos Bellingcat, blant annet norske verktøy lagt til av meg.

## Lisens

Se [LICENSE](LICENSE).
