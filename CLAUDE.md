# Knowledge Gap Finder — Project Conventions

## Overview

A Next.js web application that lets researchers upload academic papers and get an interactive visual map of what's been studied vs. what hasn't, with contradictions and gap-derived research questions surfaced automatically. Uses Claude AI for the intelligence layer and Cytoscape.js for knowledge graph visualization.

## Tech Stack

- **Framework**: Next.js (App Router, TypeScript)
- **UI**: shadcn/ui (New York style), Tailwind CSS
- **Charts**: Recharts (via shadcn chart component)
- **Graph Visualization**: Cytoscape.js via `react-cytoscapejs`
- **AI**: `@anthropic-ai/sdk` with Zod structured outputs
- **PDF Extraction**: `pdf-parse`
- **Validation**: Zod
- **Testing**: Vitest + @testing-library/react
- **Linting/Formatting**: Biome.js
- **IDs**: `nanoid`

## Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run build:static # Static export for GitHub Pages (sets STATIC_EXPORT=true)
npm start            # Start production server
npm run lint         # Run Biome linter
npm run lint:fix     # Auto-fix lint issues
npm run format       # Run Biome formatter
npm run typecheck    # TypeScript type checking
npm test             # Run Vitest tests
npm test -- --run    # Run tests once (no watch)
```

## Project Structure

- `src/app/` — Next.js App Router pages and API routes
- `src/components/` — React components organized by feature
  - `ui/` — shadcn primitives (do not edit directly)
  - `layout/` — sidebar, header, providers
  - `dashboard/`, `upload/`, `map/`, `contradictions/`, `gaps/` — feature components
- `src/hooks/` — Custom React hooks for data fetching and state
- `src/lib/` — Core business logic
  - `types/` — TypeScript interfaces (the data contracts)
  - `schemas/` — Zod schemas mirroring types
  - `ingestion/` — PDF extraction, text chunking, claim extraction pipeline
  - `analysis/` — Theme clustering, contradiction detection, gap finding, question generation
  - `ai/` — Anthropic SDK client, prompts, structured output helpers
  - `store/` — In-memory stores with JSON file persistence
  - `graph/` — AnalysisResult to GraphData transform for Cytoscape.js
  - `utils/` — ID generation, error classes
- `tests/` — Test files mirroring src/ structure
  - `__mocks__/` — Mock Anthropic client
  - `fixtures/` — Sample PDFs, JSON fixtures
  - `unit/`, `integration/`, `components/`

## Coding Conventions

- Use TypeScript strict mode
- All API responses use `ApiResponse<T>` wrapper from `src/lib/types/`
- All API inputs validated with Zod schemas from `src/lib/schemas/`
- Use `nanoid` via `src/lib/utils/id.ts` for all ID generation
- Import paths use `@/*` alias (maps to `src/*`)
- Components that use browser APIs must be marked `"use client"`
- Cytoscape.js components must use `next/dynamic` with `ssr: false`
- No real API calls in tests — always mock the Anthropic client
- Biome handles formatting and linting (not ESLint/Prettier)
- Indent with 2 spaces, max line width 100

## Environment Variables

- `ANTHROPIC_API_KEY` — Required for AI features (Claude API)
- `STATIC_EXPORT` — Set to `"true"` for static GitHub Pages build
- `NEXT_PUBLIC_BASE_PATH` — Base path for GitHub Pages (e.g., `/knowledge-gap`)

## Data Flow

1. **Upload**: PDF/text -> `pdf-extractor` -> raw text
2. **Chunk**: raw text -> `text-chunker` -> ~800 token chunks with overlap
3. **Extract**: chunks -> `claim-extractor` (Claude) -> structured claims
4. **Cluster**: claims -> `theme-clusterer` (Claude) -> themes with density
5. **Map**: themes -> `relationship-mapper` (Claude) -> typed relationships
6. **Detect**: claims -> `contradiction-detector` (Claude) -> contradictions with severity
7. **Find**: themes + relationships -> `gap-finder` (Claude) -> gaps
8. **Generate**: gaps -> `question-generator` (Claude) -> research questions
9. **Visualize**: all results -> `graph/builder` -> Cytoscape.js GraphData
