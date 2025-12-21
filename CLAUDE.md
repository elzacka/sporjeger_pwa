# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sporjeger is a Norwegian OSINT (Open Source Intelligence) tool catalog PWA. The UI is in Norwegian, while the database uses English values. Data is stored in Supabase and the app is deployed to GitHub Pages.

## Tech Stack

- **React 19.2** with TypeScript 5.9
- **Vite 7.3** for build tooling
- **Supabase** for database and auth
- **Fuse.js 7.1** for fuzzy search
- **vite-plugin-pwa 1.2** for PWA features

## Commands

```bash
npm run dev      # Start dev server on port 5174
npm run build    # TypeScript check + Vite build
npm run lint     # ESLint
npm run preview  # Preview production build
```

Scripts in `scripts/` are run with `npx tsx scripts/<name>.ts`. Example: `npx tsx scripts/sync-from-csv.ts --apply`

## Architecture

### Data Flow

1. **Supabase** stores tools/categories with views (`tools_with_categories`, `category_counts`)
2. **useTools** hook fetches and caches data in localStorage (1h TTL), handles offline fallback
3. **useFilters** manages filter state (category, type, price, region, phase)
4. **useSearch** performs Fuse.js fuzzy search with pre-built index caching

### Key Patterns

- **Path alias**: `@/` maps to `src/`
- **i18n**: `src/lib/i18n.ts` contains all Norwegian translations (database values are English)
- **Filter constants**: `src/constants/filters.ts` defines TOOL_TYPES, PRICING_MODELS, PLATFORMS, INTEL_PHASES, REGIONS
- **Routing**: Simple hash-based routing (`useHashRoute` in App.tsx), no router library
- **Admin**: Lazy-loaded AdminPanel at `#/admin`, protected by Supabase GitHub OAuth

### Components

- **BottomSheet**: Reusable slide-up modal for guides/dialogs (used by DorksGuide, HelpGuide)
- **InstallPrompt**: PWA install prompt shown when `beforeinstallprompt` event fires
- **Markdown**: Lightweight Markdown renderer for tool guides (supports headers, bold, italic, links, lists, code)
- **ToolCard**: Expandable card with "Vis mer" for tools with guides

### Database Types

Defined in `src/types/database.ts`:
- `ToolType`: web, terminal, desktop, mobile, browser_extension, api, dork, database
- `PricingModel`: free, freemium, paid
- `IntelCyclePhase`: planning, collection, processing, analysis, dissemination
- `Platform`: windows, macos, linux, android, ios, web, webapp
- `guide`: Optional Markdown field for additional info/user guides per tool

### Tool Guides (Markdown)

Tools can have a `guide` field containing Markdown-formatted additional info. The `Markdown` component (`src/components/Markdown.tsx`) renders it with support for:
- Headers (`#`, `##`, `###`)
- Bold (`**text**`), italic (`*text*`)
- Links (`[text](url)`)
- Bullet lists (`- item`) and numbered lists (`1. item`)
- Inline code (`` `code` ``)
- Escaped characters (`\*` for literal asterisk)

In ToolCard, guides are shown via an expandable "Vis mer" button. Edit guides in AdminPanel under "Tilleggsinfo (Markdown)".

### PWA Configuration

`vite.config.ts` configures vite-plugin-pwa with:
- Auto-update service worker
- NetworkFirst caching for Supabase API
- Base path `/sporjeger_pwa/` for GitHub Pages

## Environment Variables

Create `.env.local` with:
```
VITE_SUPABASE_URL=<supabase-url>
VITE_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_KEY=<service-key>  # Only for scripts
```

GitHub Actions uses these as repository secrets.

## Deployment

Push to `main` triggers `.github/workflows/deploy.yml` which builds and deploys to GitHub Pages.
