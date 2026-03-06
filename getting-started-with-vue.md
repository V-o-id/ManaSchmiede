# Getting Started with Vue in ManaSchmiede

This project now uses Vue 3 + TypeScript + Vite.

## 1) Prerequisites
- Node.js 20+ (npm included)
- Terminal (PowerShell, CMD, or bash)

Verify:
- `node -v`
- `npm -v`

## 2) Install project dependencies
From the repository root (`C:\Dev\ManaSchmiede`):

```bash
npm install
```

This installs Vue, Vite, Vitest, and all development tools from `package.json`.

## 3) Run the application locally
Start the dev server:

```bash
npm run dev
```

Vite prints a local URL (usually `http://localhost:5173`).
Open that URL in your browser to view the app.

## 4) Run quality checks
```bash
npm run lint
npm run test:run
npm run typecheck
npm run build
```

## 5) Where Vue is in this project
- App component: `src/App.vue`
- App bootstrap: `src/main.ts`
- Parser logic (Phase 2): `src/lib/decklistParser.ts`
- Parser tests: `src/lib/decklistParser.test.ts`

## 6) If you want to learn Vue basics quickly
Focus on these concepts in this codebase:
- `<script setup lang="ts">` in `src/App.vue`
- `ref()` and `computed()` for reactive state
- `v-model` for two-way textarea binding
- `v-if` / `v-else` conditional rendering
- `v-for` list rendering

