# Proposed Architecture

## Recommendation
Build an MVP as a static Vue + TypeScript web app (deployable to GitHub Pages).

## Locked Decisions (from `docs/OPEN_QUESTIONS.md`)
- Language fallback: `fallback_en`.
- Sideboard output: include in the same PDF.
- Double-faced cards: include both faces.
- Layout preference: user option for exact 3x3 vs tiny-margin mode.
- Delivery for v1: web app only.
- Decklist scope for v1: Arena export format.
- Print selection when multiple German prints exist: newest print.

## Why this fit
- No backend required for first version.
- Direct browser calls to Scryfall are viable.
- Client-side PDF generation is mature.
- Easy distribution: open URL, paste decklist, download PDF.

## High-level flow
1. User pastes Arena decklist.
2. Parser extracts entries: `quantity`, `name`, optional `set`, optional `collector_number`.
3. Resolver fetches best German print for each unique card entry.
4. If no German print exists, resolver falls back to English.
5. Image loader fetches card image URL(s) per resolved print.
6. PDF engine places cards on A4 pages in 3x3 grid and supports layout mode toggle.
7. User downloads a single PDF.

## Components
### 1) Decklist Parser
Input examples:
- `4 Lightning Strike (M19) 152`
- `2 Opt`

Output model:
- `DeckEntry { qty, name, setCode?, collectorNumber?, section }`

Rules:
- Arena export syntax only for v1.
- Preserve `Sideboard` lines and include in output.
- Validate malformed lines and report them.

### 2) Card Resolver (Scryfall client)
Strategy:
1. If `setCode + collectorNumber` exist: request specific printing first.
2. Else search by exact card name and German language filter.
3. If multiple German prints are found: choose newest print.
4. If German print unavailable: fallback to English.

Technical guards:
- Always send `Accept` header.
- For non-browser runtimes, send configured `User-Agent` value.
- Apply throttling (>=100 ms spacing) and small concurrency pool.
- Handle 404/422/429 explicitly with retry/backoff where useful.

### 3) Image Selection
Default for print quality:
- Prefer `image_uris.png` when available.
- Fallback to `image_uris.large`.
- For double-faced cards: use `card_faces[].image_uris` and include both faces.

### 4) PDF Layout Engine
Paper:
- A4 portrait (210 x 297 mm).

Card target:
- 63 x 88 mm.

Grid:
- 3 columns x 3 rows (9 cards/page).
- Mode A: exact centered 3x3.
- Mode B: tiny-margin optimization (slightly reduced margins).

Output:
- Single multi-page PDF.
- Optional crop marks and card index text.

### 5) UI
Minimal MVP screens:
- Decklist textarea.
- Options panel (layout mode, image quality).
- Generate button + progress indicator.
- Error list for unresolved cards.
- Download PDF button.

## Suggested tech stack
- Frontend: Vue + TypeScript + Vite.
- PDF: `pdf-lib`.
- State: lightweight local state.
- Testing: Vitest for parser and layout math.

## Deployment
- Host static build on GitHub Pages.
- Use GitHub Actions to build and publish `dist/`.

## Risks and mitigations
1. Missing German print
Mitigation: `fallback_en` resolver mode and unresolved-card report.

2. API throttling (429)
Mitigation: request queue + backoff + caching.

3. Print scaling differences between printers
Mitigation: explicit "print at 100%" notice and calibration/crop marks.
