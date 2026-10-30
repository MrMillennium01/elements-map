# Project knowledge

## Environment and commands

- Local checkout: `C:\Users\linyi\elements-map`.
- Remote: `https://github.com/MrMillennium01/elements-map.git`, branch `main`.
- Node.js 24.x and npm; dependencies are pinned in `package-lock.json`.
- On this Windows machine, use PowerShell and `npm.cmd` / `npx.cmd`.
- Install: `npm ci`.
- Development: `npm run dev -- --port 5173 --strictPort`.
- Unit tests: `npm test`.
- Type checking: `npm run typecheck`.
- Lint: `npm run lint`.
- Production build: `npm run build`.
- Combined checks: `npm run verify`.
- Browser tests: `npm run test:e2e`. Playwright starts its own Vite server on port 4173. Install Chromium with `npx playwright install chromium` when needed.

## Architecture and data

- React/TypeScript/Vite web UI lives in `src/`.
- `packages/core/` is framework-independent TypeScript, intended to be shared with a future React Native application. Keep DOM and browser APIs out of this package.
- German UI. Two primary views: periodic table and map. Map modes: `occurrences`, `production`, `reserves`. URL query parameters preserve the view, element and mode.
- MapLibre renders local Natural Earth country geometries; no API keys, external tiles or live data requests are required at runtime.
- All 118 elements have PubChem properties and German descriptions. Twelve elements have resource datasets.
- Production and reserves are manually transcribed from USGS Mineral Commodity Summaries 2026 in `packages/core/src/data/minerals.ts`. Production refers to estimated calendar-year 2025 quantities; reserves are the 2026 report's figures.
- Values are normalized to metric tonnes. Aluminium maps show bauxite ore weight, not contained aluminium. Iron uses iron content, with different source multipliers for production and reserves.
- Preserve unknown, withheld and reported-zero values separately. Do not calculate world shares from lower-bound totals or totals excluding withheld production.
- Occurrences are 1,434 historical MRDS records, geographically thinned by element. They are not a complete inventory, current operating-status dataset, or a proxy for resource quantities.
- `scripts/import-data.mjs` imports PubChem, country geometry and MRDS snapshots. `data/provenance.json` records sources, hashes and selection rules. Raw downloads are cached under ignored `data/raw/`.
- In this environment Node downloads need the existing environment proxy: `node --use-env-proxy scripts/import-data.mjs`. Python urllib downloads from USGS needed an explicit `User-Agent`.

## Paused checkpoint — 2026-10-30

The user requested saving the work before closing their laptop. Implementation is a work in progress, not a verified release.

- All 15 core unit tests passed.
- npm installation reported no known vulnerabilities.
- Playwright Chromium was installed.
- The development server was stopped before saving.
- Type checking currently reports two errors:
  - `packages/core/src/index.ts`: the imported country centers are inferred as `number[]`, but the exported model requires `[number, number]`. Construct typed tuples rather than masking the mismatch.
  - `src/components/WorldMap.tsx`: the dynamically constructed MapLibre `match` expression does not prove the required first label/output pair to TypeScript. Build a properly typed nonempty expression, with a fallback for an empty dataset.
- Lint currently reports two unnecessary escaped double quotes in the CSV fixture in `packages/core/src/core.test.ts`.
- Browser/E2E tests and the production build have not yet been run. Visual checks on desktop/mobile, real map interactions, modal focus behavior and WebGL failure fallback still need verification.
- E2E coverage has been written in `tests/e2e/atlas.spec.ts`, including all three map modes, deep links/history, unavailable data, keyboard use, mobile overflow and absence of external runtime requests.
- No deployment has been made. No cloud environment blueprint has been created.
