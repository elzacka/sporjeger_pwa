# Sporjeger

Norsk OSINT-katalog med over 350 verktøy for research i åpne kilder. Minimalistisk PWA.

**Live:** https://elzacka.github.io/sporjeger_pwa/

## Om appen

Appen er en ren leseklient: ingen innlogging, ingen skriving. Katalogen vedlikeholdes automatisk mot Supabase (synkronisering med Bellingcat Toolkit, kvalitetskontroll og lenkesjekk).

## Funksjoner

- Fuzzy-søk med naturlig språk («gratis terminal»)
- Kategori- og filterbasert navigering (fase, kategori, type, pris, region)
- Alltid synlig teller for totalt antall verktøy
- Offline-støtte via Service Worker
- Tastatursnarvei: `Ctrl+K` fokuserer søk, `Esc` nullstiller
- Veiledning i bunnark (native dialog)
- PWA-installasjon med egen prompt
- Markdown-baserte verktøyguider med kodeblokker og klikkbare URL-er
- Varselsindikator for verktøy som krever ekstra bevissthet om rettslig grunnlag

## Teknologi

- React 19.2 + TypeScript 5.9
- Vite 7.3 + vite-plugin-pwa 1.2
- Supabase (database, kun lesetilgang)
- Fuse.js 7.1 (fuzzy-søk)
- Selvhostede fonter og ikoner (ingen eksterne CDN-er)

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
npm run lint     # ESLint
```

## Deploy

Push til `main` trigger `.github/workflows/deploy.yml`, som bygger og publiserer til GitHub Pages. Miljøvariablene over ligger som repository secrets.

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

## Lisens

Se [LICENSE](LICENSE).
