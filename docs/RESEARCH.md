# Research Notes (Verified)

Date checked: February 19, 2026

## Scryfall API constraints
1. API requests to `api.scryfall.com` require both `User-Agent` and `Accept` headers.
Source: https://scryfall.com/docs/api

2. Scryfall asks clients to add 50-100 ms delay between requests (about 10 requests/sec average) and may return HTTP 429 when overloaded.
Source: https://scryfall.com/docs/api

3. `POST /cards/collection` accepts card identifier objects and allows up to 75 references per request.
Source: https://scryfall.com/docs/api/cards/collection

4. Scryfall search syntax supports language filters with `lang:` / `language:`. Example syntax includes `lang:any`.
Source: https://scryfall.com/docs/syntax

5. Scryfall language docs list German as language code `de`.
Source: https://scryfall.com/docs/api/languages

6. Scryfall documents CORS behavior for browser clients and states that API/image origins provide CORS headers (with normal Origin-header requirements).
Source: https://scryfall.com/docs/api/http-concerns

7. Scryfall image documentation lists formats and sizes, including `png` (745x1040) and `large` (672x936).
Source: https://scryfall.com/docs/api/images

## GitHub Pages constraints
8. GitHub Pages is static hosting for HTML/CSS/JS files from a repository and optional build process.
Source: https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages

9. GitHub Pages does not support server-side languages like PHP, Ruby, or Python.
Source: https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site

10. GitHub Pages can be published with custom build workflows (GitHub Actions), which is useful for modern frontend tooling.
Source: https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site

## PDF generation in browser
11. `pdf-lib` is designed for modern JavaScript runtimes including browsers.
Source: https://github.com/Hopding/pdf-lib

## Practical conclusion for ManaSchmiede
A static TypeScript web app on GitHub Pages is a viable architecture for this project.

## Notes on inference
- Arena decklists are usually parseable as `qty name (SET) number`; this is implementation practice, not a strict Scryfall rule.
- "Perfect card-size" in print still depends on printer scaling. The app should include print instructions and optional calibration marks.
