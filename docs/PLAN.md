# Implementation Plan

Date created: February 19, 2026
Last updated: March 6, 2026

## Status Snapshot
- Phase 0: completed (decisions captured in `docs/OPEN_QUESTIONS.md`).
- Phase 1: completed (scaffold, lint/test baseline, config, and runtime checks completed).
- Phase 2: completed (Arena parser, diagnostics, tests, and parser preview UI implemented).
- Phase 3: completed (Scryfall client, resolver strategy, retry/throttling/cache, and UI integration).

## Phase 0 - Decisions
- Confirm language fallback behavior (`strict_de` vs `fallback_en`).
- Confirm sideboard handling.
- Confirm card backs / double-faced strategy.

Exit criteria:
- Product decisions documented in `docs/OPEN_QUESTIONS.md` answers.

## Phase 1 - Project scaffold
- Create TypeScript frontend app scaffold.
- Add lint/test baseline.
- Add environment/config for User-Agent string and app metadata.

Progress:
- Done: Vue + TypeScript + Vite scaffold files.
- Done: ESLint baseline config.
- Done: Vitest + Vue Test Utils baseline with smoke test.
- Done: `.env.example` and metadata config module.
- Done: executed `npm run lint`, `npm run test:run`, `npm run typecheck`, and `npm run build`.

Exit criteria:
- Local app starts and basic CI checks run.

## Phase 2 - Decklist parsing
- Implement Arena decklist parser with test cases.
- Return structured entries + parse diagnostics.

Progress:
- Done: `parseArenaDecklist` implementation in `src/lib/decklistParser.ts`.
- Done: section-aware parsing for Deck/Sideboard/Commander/Companion headers.
- Done: diagnostics for malformed lines and invalid quantities.
- Done: parser tests in `src/lib/decklistParser.test.ts`.
- Done: parser preview integration in `src/App.vue`.

Exit criteria:
- Parser handles common Arena exports and reports malformed lines cleanly.

## Phase 3 - Scryfall integration
- Implement API client with required headers.
- Add resolver logic (specific print first, then search fallback).
- Add request throttling, retry-on-429, and local cache.

Progress:
- Done: typed Scryfall API data models in `src/lib/scryfallTypes.ts`.
- Done: Scryfall client with GET cache, request queue, throttling, and retry logic in `src/lib/scryfallClient.ts`.
- Done: resolver pipeline (set/collector first, newest-print search, German to English fallback) in `src/lib/cardResolver.ts`.
- Done: unit tests for client and resolver in `src/lib/scryfallClient.test.ts` and `src/lib/cardResolver.test.ts`.
- Done: Vue UI integration with manual \"Resolve Cards via Scryfall\" flow in `src/App.vue`.

Exit criteria:
- Sample decklist resolves cards reliably.

## Phase 4 - PDF generation
- Implement A4 layout math.
- Render 3x3 card grid pages.
- Support multi-page output and download.

Exit criteria:
- Generated PDF has correct card dimensions and page packing.

## Phase 5 - UX and error handling
- Add progress UI and unresolved-card summary.
- Add print instructions (100% scale, no fit-to-page).
- Add options panel.

Exit criteria:
- End-to-end flow works from paste to download.

## Phase 6 - Deployment
- Deploy to GitHub Pages.
- Add release checklist.

Exit criteria:
- Public URL generates PDFs without backend.

## Nice-to-have after MVP
- Cut marks toggle.
- Optional bleed offset.
- Token auto-append.
- Saved deck presets in localStorage.
