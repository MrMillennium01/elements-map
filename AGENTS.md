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
- Production browser tests: build first, then run `npm run test:e2e -- --workers=2` with `PLAYWRIGHT_PREVIEW=1`. The test server runs the built site on port 4174.

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

## Map integration and verification

- MapLibre 6 requires explicit worker configuration with Vite: import `maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url` and call `setWorkerUrl` before creating a map. Plain `?url` does not bundle the worker's dependencies.
- The map container needs explicit `width: 100%; height: 100%`. MapLibre's unlayered CSS overrides the position set inside the application's CSS layers; relying on absolute positioning alone results in a zero-height clipped map.
- Browser tests must assert the map container dimensions and interact with actual rendered countries and markers, not only check that a canvas exists.
- Nearby MRDS sites can overlap at low zoom. Hover and click handlers select the closest rendered point, not the first feature returned by the renderer.
- Fontsource 5.3 exports the package root stylesheet; the installed packages do not contain `latin.css`.
- `tests/e2e/atlas.spec.ts` runs on desktop Chromium and an emulated Pixel 7. Coverage includes all three map modes, real country/marker selection, deep links/history, unavailable data, keyboard use, mobile overflow, accessible controls, CSV downloads, clipboard fallback, failed map requests and retry.
- Keep the browser tests against both the dev server and production assets to catch worker/asset bundling regressions.
- `npm run verify` passes: lint, 20 unit tests, type checking and production build.
- All 22 browser tests pass against both development and production servers.
- No deployment has been made. No cloud environment blueprint has been created.
