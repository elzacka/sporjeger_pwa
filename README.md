# Sporjeger

Norsk OSINT-verktøykatalog. Minimalistisk PWA bygget med React 19.2 og Supabase.

## Oppsett

### 1. Installer Node.js

```bash
brew install node
```

### 2. Installer avhengigheter

```bash
npm install
```

### 3. Konfigurer Supabase

Kopier `.env.example` til `.env` og fyll inn verdiene fra Supabase Dashboard:

```bash
cp .env.example .env
```

Rediger `.env`:
```
VITE_SUPABASE_URL=https://din-prosjekt-id.supabase.co
VITE_SUPABASE_ANON_KEY=din-anon-key
```

### 4. Start utviklingsserver

```bash
npm run dev
```

Åpne http://localhost:5174

## Bygg for produksjon

```bash
npm run build
```

Output havner i `dist/` mappen.

## Struktur

```
src/
├── components/     # React-komponenter
├── hooks/          # Custom hooks (useTools, useSearch)
├── lib/            # Supabase-klient, i18n
├── styles/         # Global CSS
└── types/          # TypeScript-typer
```

## Funksjoner

- Fuzzy-søk med naturlig språk ("gratis terminal")
- Offline-støtte via Service Worker
- Tastatursnarvei: `Ctrl+K` fokuserer søk, `Esc` nullstiller
- Minimalistisk, distraksjonsfritt design
