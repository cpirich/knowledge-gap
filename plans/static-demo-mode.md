# Plan: Static Demo Mode for GitHub Pages

## Context

The deploy workflow builds a static export for GitHub Pages, but API routes require a Node.js server and won't function at runtime on static hosting. This change adds a demo mode that bypasses all API fetches and serves pre-loaded fixture data, so the GitHub Pages deployment works as a functional preview.

## Approach

Create a central demo data module (`src/lib/demo/data.ts`) that exports an `isStaticDemo` flag and pre-built demo data. Each hook and page component checks this flag and short-circuits with the demo data instead of fetching.

A new env var `NEXT_PUBLIC_STATIC_DEMO=1` controls demo mode (needs the `NEXT_PUBLIC_` prefix to be available in client bundles). This is separate from `STATIC_EXPORT` which controls the Next.js build output mode.

## Files to Create

### `src/lib/demo/data.ts` — Central demo data module
- Exports `isStaticDemo` boolean from `process.env.NEXT_PUBLIC_STATIC_DEMO === "1"`
- Imports fixture JSON from `tests/fixtures/analysis-results.json` and `extracted-claims.json` (`resolveJsonModule` is already enabled in tsconfig)
- Exports `demoAnalysis` (cast from fixture), `demoClaims` (from fixture), `demoPapers` (hand-crafted Paper objects matching fixture IDs `paper_fixture_1`/`paper_fixture_2`), `demoGraphData` (built via `buildGraphData()` from `src/lib/graph/builder.ts`)
- Exports `demoClaimsMap` and `demoPapersMap` for the contradictions page

## Files to Modify

### Hooks (4 files) — Add demo short-circuit

Each hook gets an early return when `isStaticDemo` is true:

- **`src/hooks/use-papers.ts`**: Initialize state with `demoPapers`, skip fetch, `loading: false`
- **`src/hooks/use-graph-data.ts`**: Initialize state with `demoGraphData`, skip fetch, `loading: false`
- **`src/hooks/use-analysis.ts`**: Initialize state with `demoAnalysis`, `analyze()` and `fetchResult()` return demo data
- **`src/hooks/use-upload.ts`**: `upload()` throws `"Upload is disabled in demo mode"` (existing try/catch in upload page shows this as a toast)

### Page components (4 files) — Add demo check in direct fetches

- **`src/app/page.tsx`**: In the `useEffect`, set `analysis` to `demoAnalysis` and skip fetch
- **`src/app/gaps/page.tsx`**: Same pattern — set analysis from demo data, set `loading: false`
- **`src/app/contradictions/page.tsx`**: Set `analysis`, `claims` map, and `papers` map from demo data (this page fetches 3 endpoints including the non-existent `/api/claims`)
- **`src/app/upload/page.tsx`**: Show a "Demo Mode" placeholder instead of the file dropzone; hide upload progress; pass `onDelete={undefined}` to `PaperList` (prop is already optional, delete button conditionally renders)

### Layout — Demo banner

- **`src/components/layout/header.tsx`**: Render a small amber banner above the header when `isStaticDemo` is true: "Demo Mode — Viewing sample sleep research data"

### CI — Set the env var

- **`.github/workflows/deploy.yml`**: Add `NEXT_PUBLIC_STATIC_DEMO: "1"` to the build step env

### Lint fix (already done)

- **`biome.json`**: Add `!**/out` to excludes (already applied, will be included in commit)
- **`src/app/api/*/route.ts`** (6 files): Add `export const dynamic = "force-static"` (already applied)

## Verification

1. `npm run typecheck` — no TypeScript errors
2. `npm test -- --run` — all tests pass
3. `npm run lint` — no lint errors
4. `NEXT_PUBLIC_STATIC_DEMO=1 npm run dev` — all pages show demo data, no fetch errors in console
5. `STATIC_EXPORT=true NEXT_PUBLIC_STATIC_DEMO=1 npm run build:static` — build succeeds
6. `npx serve out/` — static site works with demo data on all pages
