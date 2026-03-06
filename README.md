# ManaSchmiede

German MTG proxy sheet generator.

## What This Project Is
ManaSchmiede takes an Arena-style decklist, fetches German card prints from Scryfall, and generates one printable A4 PDF (3x3 cards per page, card-size for sleeving).

## Product Decisions
- Language fallback: `fallback_en`.
- Sideboard: included in the same PDF.
- Double-faced cards: include both faces.
- Layout mode: user-selectable between exact 3x3 and tiny-margin preference.
- Delivery for v1: web app only (GitHub Pages).
- Frontend: Vue + TypeScript.
- Decklist scope for v1: Arena export only.
- Multiple German prints: newest print.

## Progress Status
Phase 1 completed:
- Vue + TypeScript + Vite project structure.
- ESLint baseline.
- Vitest + Vue Test Utils baseline with smoke test.
- Environment config for app metadata and Scryfall client identity.

Phase 2 completed:
- Arena decklist parser with typed output and diagnostics.
- Parser test suite for valid and malformed Arena decklist lines.
- Parser preview UI in `App.vue` with live parsed entries and diagnostics.

Phase 3 completed:
- Scryfall API client with request throttling, retry-on-429/5xx, and in-memory GET cache.
- Card resolver strategy: set/collector lookup first, newest-print name search fallback, German to English fallback.
- Resolution UI section with unresolved-card reporting.

## Local Development
Prerequisite: Node.js 20+ (includes `npm`).

1. Install dependencies: `npm install`
2. Start dev server: `npm run dev`
3. Run checks: `npm run lint`, `npm run test:run`, `npm run typecheck`

## Environment Variables
See `.env.example`:
- `VITE_APP_NAME`
- `VITE_APP_VERSION`
- `VITE_APP_REPOSITORY_URL`
- `VITE_SCRYFALL_USER_AGENT`

Note: in browsers, `User-Agent` is controlled by the runtime and cannot be manually set by fetch. The configured identity string is still useful for future server-side or CLI integrations.

## Docs In This Repo
- `docs/RESEARCH.md`: verified external constraints and source links.
- `docs/ARCHITECTURE.md`: recommended system design and data flow.
- `docs/PLAN.md`: implementation plan with milestones.
- `docs/OPEN_QUESTIONS.md`: answered product decisions.
- `getting-started-with-vue.md`: local setup and run guide for Vue.

## Date Of This Snapshot
This documentation was updated on March 6, 2026.
