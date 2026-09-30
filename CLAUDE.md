# Sporjeger

## Overview

Sporjeger is a Norwegian OSINT tool catalog PWA: pure read-only client, no auth, no writes. Catalog maintenance (Bellingcat sync, enrichment, URL health checks, quality sweeps) runs through scheduled Claude tasks that talk directly to Supabase with the service key — not through this app.

Database language split: enum-style columns (`tool_type`, `pricing_model`, `platforms`, `intel_cycle_phases`, `regions`) are English and translated for display in `src/lib/i18n.ts`; `description` and `guide` are stored in Norwegian klarspråk and rendered as-is.

Version lives in `package.json`.

Setup, commands, structure and deploy are documented in `README.md`.

Security scope: OWASP ASVS L1 (latest released edition) plus L2 for Markdown sanitising, authorization at RLS and service-key handling; Top 10, WSTG, API Security Top 10 (Supabase PostgREST as `anon`), CI/CD Top 10. LLM and Agentic Top 10 apply only to the off-app maintenance tasks, not to the app.

## Working conventions

- Fonts and icons are self-hosted (`@fontsource/*`, inline SVG) — the meta-CSP in `index.html` blocks external CDN resources
- Verify: `npm run build` (`tsc -b` strict with `noUnusedLocals`/`noUnusedParameters`, then Vite; same as CI). No tests, no `npm run lint`; check UI in `npm run dev` at `localhost:5174/sporjeger_pwa/`
- No ESLint while `typescript-eslint`'s peer range excludes the TypeScript major in `package.json`; check: `npm view typescript-eslint peerDependencies.typescript`
- Test in the local dev server and let the owner verify before committing (differs from global)

## Invariants

- `getTools` throws rather than returning a partial list — a partial list would get cached as the complete catalog
- localStorage cache keys carry `CACHE_VERSION` (`useTools.ts`) — bump it on any `src/types/database.ts` schema change
- The cache never expires on read: offline users always get the last known catalog; freshness comes from revalidating when online
- Search has no result limit: the visible counter equals the actual matches
- Service worker NetworkFirst pattern stays scoped to `/rest/v1/`, never widened to all of `*.supabase.co` (would cache auth endpoints)
- Base path is `/sporjeger_pwa/` (GitHub Pages) — use `import.meta.env.BASE_URL`, never hardcode `/`
- `BottomSheet` listens for Escape in capture phase and stops propagation, so Escape closes the sheet without clearing search/filters in `CommandSearch`
- CSS Modules hash only the leftmost class — a bare descendant selector like `.footer span:first-child` matches any nested component under `<footer>`; target elements by their own class
- `PricingModel.freemium` renders as «Gratish» — intentional wordplay, keep it
- `src/components/Markdown.tsx` renders untrusted guide content into `dangerouslySetInnerHTML`: HTML-escape everything (including `"`/`'`) before parsing, and allowlist link hrefs to `http(s)://`
- RLS: public SELECT only, zero write policies for anon/authenticated; never reintroduce write policies for `authenticated`
