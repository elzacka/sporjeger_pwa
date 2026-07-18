# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sporjeger is a Norwegian OSINT tool catalog PWA. The UI is in Norwegian, while database values are English. The app is a pure read-only client: no auth, no writes. All catalog maintenance (Bellingcat sync, enrichment, URL health checks, quality sweeps) runs through scheduled Claude tasks that talk directly to Supabase with the service key.

**Current version: 2.1.0** — update this line and `package.json` together (semver: PATCH fixes, MINOR features, MAJOR breaking/removals).

Setup, commands, structure, and deploy are documented in `README.md` — do not duplicate them here.

## Working Conventions

- Norwegian UI text follows klarspråk and always uses æ, ø, å — never oe, o, a/aa
- No emojis in code, UI, docs, or commits
- Fonts and icons are self-hosted (`@fontsource/*` imported in `main.tsx`, SVG icons inline) — never add external CDN resources; the meta-CSP in `index.html` will block them
- Commit format: `type: description` (feat/fix/docs/refactor/test), no emoji
- Always test in the local dev server and let the user verify before committing

## Architecture

### Data Flow

1. **Supabase** stores tools/categories, read through views (`tools_with_categories`, `category_counts`) with anon key + public SELECT policies only
2. **useTools** fetches in 1000-row batches, caches in localStorage (1h TTL), falls back to cache when offline or on fetch errors. On errors, `getTools` throws — never return partial lists, they would be cached as a complete catalog
3. **useFilters** manages filter state (category, type, price, region, phase)
4. **useSearch** runs Fuse.js fuzzy search with a cached pre-built index, no result limit (the visible counter must equal actual matches)

### Key Patterns

- **Path alias**: `@/` maps to `src/`
- **i18n**: `src/lib/i18n.ts` holds all Norwegian UI strings and category translations
- **Filter constants**: `src/constants/filters.ts` (TOOL_TYPES, PRICING_MODELS, PLATFORMS, INTEL_PHASES, REGIONS)
- **Single view**: no routing (hash routing and `#/admin` were removed in v2.0.0)
- **Escape handling**: `BottomSheet` listens in capture phase and stops propagation so Escape closes the sheet without clearing search/filters in `CommandSearch` — preserve this if touching either

### Caching Rules

- localStorage cache keys are versioned (`CACHE_VERSION` in `useTools.ts`). Bump it on any schema change in `src/types/database.ts` so users never see stale shapes; old keys are pruned automatically
- Service worker (vite-plugin-pwa, autoUpdate) uses NetworkFirst for Supabase — the pattern must stay scoped to `/rest/v1/`, never widen it to all of `*.supabase.co` (would cache auth endpoints)
- Base path is `/sporjeger_pwa/` (GitHub Pages) — never hardcode `/` in navigation; use `import.meta.env.BASE_URL`

### Database Types

Defined in `src/types/database.ts`:

- `ToolType`: web, terminal, desktop, mobile, browser_extension, api, dork, database
- `PricingModel`: free, freemium, paid (freemium renders as «Gratish» — intentional wordplay, keep it)
- `IntelCyclePhase`: planning, collection, processing, analysis, dissemination
- `Platform`: windows, macos, linux, android, ios, web, webapp
- `guide`: optional Markdown per tool, rendered by the `Markdown` component, shown via «Vis mer» in ToolCard
- `caution_level`: 0 by default; 1 shows an amber indicator on ToolCard

### Markdown Renderer Security Invariants

`src/components/Markdown.tsx` renders tool guides (headers, bold/italic, links, autolinks, lists, inline code, fenced code blocks, escaped characters) into `dangerouslySetInnerHTML`. Non-negotiable invariants:

- HTML-escape everything — including `"` and `'` — before any parsing (attribute-injection defense)
- Link hrefs are allowlisted to `http(s)://`; other schemes render as plain text
- Guide content comes from the database and must stay treated as untrusted

## Supabase Access Model

RLS: public SELECT only; zero write policies for anon/authenticated roles (dropped in migration `remove_authenticated_write_policies`). Writes happen exclusively via the service key in scheduled Claude tasks. Never reintroduce write policies for the `authenticated` role.
