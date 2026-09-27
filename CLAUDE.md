# CLAUDE.md

## Overview

Sporjeger is a Norwegian OSINT tool catalog PWA: pure read-only client, no auth, no writes. Catalog maintenance (Bellingcat sync, enrichment, URL health checks, quality sweeps) runs through scheduled Claude tasks that talk directly to Supabase with the service key — not through this app.

Database language split: enum-style columns (`tool_type`, `pricing_model`, `platforms`, `intel_cycle_phases`, `regions`) are English and translated for display in `src/lib/i18n.ts`; `description` and `guide` are stored in Norwegian klarspråk and rendered as-is.

Version lives in `package.json`.

Setup, commands, structure and deploy are documented in `README.md`.

## Working conventions

- Fonts and icons are self-hosted (`@fontsource/*`, inline SVG) — the meta-CSP in `index.html` blocks external CDN resources
- No ESLint: `typescript-eslint` doesn't yet support TypeScript 7. `tsc -b` (strict, `noUnusedLocals`, `noUnusedParameters`) is the check — run `npm run build`; there is no `npm run lint`
- Test in the local dev server and let the owner verify before committing

## Invariants

- `getTools` throws rather than returning a partial list — a partial list would get cached as the complete catalog
- localStorage cache keys carry `CACHE_VERSION` (`useTools.ts`) — bump it on any `src/types/database.ts` schema change
- Service worker NetworkFirst pattern stays scoped to `/rest/v1/`, never widened to all of `*.supabase.co` (would cache auth endpoints)
- Base path is `/sporjeger_pwa/` (GitHub Pages) — use `import.meta.env.BASE_URL`, never hardcode `/`
- `BottomSheet` listens for Escape in capture phase and stops propagation, so Escape closes the sheet without clearing search/filters in `CommandSearch`
- CSS Modules hash only the leftmost class — a bare descendant selector like `.footer span:first-child` matches any nested component under `<footer>`; target elements by their own class
- `PricingModel.freemium` renders as «Gratish» — intentional wordplay, keep it
- `src/components/Markdown.tsx` renders untrusted guide content into `dangerouslySetInnerHTML`: HTML-escape everything (including `"`/`'`) before parsing, and allowlist link hrefs to `http(s)://`
- RLS: public SELECT only, zero write policies for anon/authenticated; never reintroduce write policies for `authenticated`
