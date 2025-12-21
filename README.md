# Sporjeger

Norsk OSINT-verktøykatalog med over 1000 verktøy. Minimalistisk PWA bygget med React 19.2 og Supabase.

**Live:** https://elzacka.github.io/sporjeger_pwa/

## Tech Stack

- React 19.2 + TypeScript 5.9
- Vite 7.3 + vite-plugin-pwa 1.2
- Supabase (database + auth)
- Fuse.js 7.1 (fuzzy search)

## Oppsett

### 1. Installer avhengigheter

```bash
npm install
```

### 2. Konfigurer Supabase

Lag `.env.local`:
```
VITE_SUPABASE_URL=https://din-prosjekt-id.supabase.co
VITE_SUPABASE_ANON_KEY=din-anon-key
```

### 3. Start utviklingsserver

```bash
npm run dev
```

Åpne http://localhost:5174/sporjeger_pwa/

## Bygg

```bash
npm run build    # Produksjonsbygg i dist/
npm run preview  # Forhåndsvis bygg
```

## Struktur

```
src/
├── components/     # React-komponenter (BottomSheet, ToolCard, etc.)
├── hooks/          # Custom hooks (useTools, useSearch, useFilters)
├── lib/            # Supabase-klient, i18n
├── styles/         # Global CSS
└── types/          # TypeScript-typer
```

## Funksjoner

- Fuzzy-søk med naturlig språk ("gratis terminal")
- Kategori- og filterbasert navigering
- Offline-støtte via Service Worker
- Tastatursnarvei: `Ctrl+K` fokuserer søk, `Esc` nullstiller
- Google Dorks-guide og veiledning (bottom sheets)
- PWA-installasjons-prompt
- Admin-panel for redigering (`#/admin`)
- Markdown-baserte verktøy-guider
