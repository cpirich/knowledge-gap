# Knowledge Gap Finder — Implementation Plan

## Context

Researchers, foundations, and policy teams currently have no turnkey tool to upload a collection of academic papers and get an interactive visual map of what's been studied vs. what hasn't, with contradictions and gap-derived research questions surfaced automatically. This project builds that tool as a Next.js web application using Claude AI for the intelligence layer and Cytoscape.js for knowledge graph visualization.

The repo is bare (only `.claude/settings.local.json` exists). Node v22.13.1 / npm 10.9.2 are available.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js App Router                    │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ Dashboard │  │ Knowledge Map│  │ Contradictions &  │  │
│  │ (stats,  │  │ (Cytoscape.js│  │ Gaps Pages        │  │
│  │  charts) │  │  interactive)│  │ (side-by-side,    │  │
│  │          │  │              │  │  question cards)   │  │
│  └────┬─────┘  └──────┬───────┘  └────────┬──────────┘  │
│       └───────────┬────┴───────────────────┘             │
│            Custom React Hooks (fetch + state)            │
│  ┌───────────────────────────────────────────────────┐   │
│  │           Next.js API Routes (POST/GET)            │   │
│  │  /api/ingest  /api/papers  /api/analyze/*  /api/graph│ │
│  └──────────┬────────────────────┬───────────────────┘   │
└─────────────┼────────────────────┼───────────────────────┘
              │                    │
   ┌──────────▼──────┐  ┌─────────▼──────────┐
   │ Ingestion Engine │  │  Analysis Engine    │
   │ pdf-parse → chunk│  │ theme clustering    │
   │ → Claude extract │  │ contradiction detect│
   │                  │  │ gap finding         │
   │                  │  │ question generation │
   └────────┬─────────┘  └─────────┬──────────┘
            │                      │
   ┌────────▼──────────────────────▼──────────┐
   │  AI Layer (@anthropic-ai/sdk + Zod)      │
   │  Structured outputs, prompts, retry      │
   └──────────────────────────────────────────┘
   ┌──────────────────────────────────────────┐
   │  In-Memory Store (JSON file persistence) │
   └──────────────────────────────────────────┘
```

**Build modes:**
- `npm run dev` / `npm start` — Full app with API routes (primary use case)
- `npm run build:static` (sets `STATIC_EXPORT=true`) — Static export for GitHub Pages; ships pre-computed demo data; UI fully functional as a showcase

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (latest, App Router, TypeScript) |
| UI Components | shadcn/ui (New York style) |
| Charts | Recharts (via shadcn chart component) |
| Graph Visualization | Cytoscape.js via `react-cytoscapejs` |
| AI | `@anthropic-ai/sdk` with Zod structured outputs |
| PDF Extraction | `pdf-parse` |
| Validation | Zod |
| Testing | Vitest + @testing-library/react |
| Linting/Formatting | Biome.js |
| IDs | `nanoid` |

---

## Data Contracts (TypeScript Interfaces)

These types in `src/lib/types/` are the contracts between all workstreams. They must be finalized first.

### Core Entities

**Paper** — `src/lib/types/paper.ts`
```
Paper { id, filename, title, authors[], abstract, uploadedAt, sourceType("pdf"|"text"), rawText, chunks[], claimIds[], status }
PaperStatus = "uploading" | "extracting_text" | "chunking" | "extracting_claims" | "ready" | "error"
Chunk { id, paperId, content, startOffset, endOffset, chunkIndex, tokenEstimate }
```

**Claim** — `src/lib/types/claim.ts`
```
Claim { id, paperId, chunkId, type("assertion"|"methodology"|"finding"|"citation"), statement, evidence, confidence("high"|"medium"|"low"), themeIds[], metadata }
ClaimMetadata { pageNumber?, section?, citedSources?[], methodology? }
```

**Theme & Relationship** — `src/lib/types/theme.ts`
```
Theme { id, label, description, claimIds[], paperIds[], density(0-1), parentThemeId? }
Relationship { id, sourceThemeId, targetThemeId, type("supports"|"contradicts"|"extends"|"prerequisite"|"parallel"|"methodology_shared"), strength(0-1), evidence }
```

**Analysis Results** — `src/lib/types/analysis.ts`
```
Contradiction { id, claimAId, claimBId, paperAId, paperBId, description, severity("critical"|"major"|"minor"), category("direct_conflict"|"methodological"|"scope_difference"|"temporal"|"interpretation"), resolution? }
Gap { id, title, description, type("unexplored_intersection"|"sparse_coverage"|"methodological_gap"|"temporal_gap"|"contradictory_area"), relatedThemeIds[], confidence, evidence, potentialImpact }
ResearchQuestion { id, gapId, question, rationale, relatedThemeIds[], suggestedMethodology?, priorityScore(0-1) }
AnalysisResult { id, paperIds[], themes[], relationships[], contradictions[], gaps[], questions[], createdAt, status }
```

**Graph** — `src/lib/types/graph.ts`
```
GraphNode { data: { id, label, type("theme"|"paper"|"gap"), size, color, density?, claimCount?, isGap? } }
GraphEdge { data: { id, source, target, label, type, strength, color } }
GraphData { nodes[], edges[] }
```

**API** — `src/lib/types/index.ts`
```
ApiResponse<T> { success, data?, error?: { code, message, details? } }
```

---

## Project Structure

```
knowledge-gap/
├── .claude/
│   ├── settings.json
│   └── settings.local.json        (existing)
├── .github/workflows/
│   ├── ci.yml                     (lint + typecheck + test + build)
│   ├── deploy.yml                 (GitHub Pages)
│   └── claude.yml                 (Claude Code PR review)
├── public/
│   └── demo-data.json             (pre-computed sample for static mode)
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx               (dashboard)
│   │   ├── globals.css
│   │   ├── upload/page.tsx
│   │   ├── map/page.tsx
│   │   ├── contradictions/page.tsx
│   │   ├── gaps/page.tsx
│   │   └── api/
│   │       ├── ingest/route.ts
│   │       ├── papers/route.ts
│   │       ├── analyze/
│   │       │   ├── contradictions/route.ts
│   │       │   ├── gaps/route.ts
│   │       │   └── questions/route.ts
│   │       └── graph/route.ts
│   ├── components/
│   │   ├── ui/                    (shadcn primitives)
│   │   ├── layout/                (sidebar, header, providers)
│   │   ├── dashboard/             (stats-cards, density-chart, recent-activity)
│   │   ├── upload/                (file-dropzone, upload-progress, paper-list)
│   │   ├── map/                   (knowledge-graph, graph-controls, node-detail-panel)
│   │   ├── contradictions/        (contradiction-list, side-by-side-view, severity-badge)
│   │   └── gaps/                  (gap-list, question-card, intersection-matrix)
│   ├── hooks/
│   │   ├── use-papers.ts
│   │   ├── use-analysis.ts
│   │   ├── use-graph-data.ts
│   │   └── use-upload.ts
│   └── lib/
│       ├── types/                 (all interfaces above)
│       ├── schemas/               (Zod schemas mirroring types)
│       ├── ingestion/
│       │   ├── pdf-extractor.ts
│       │   ├── text-chunker.ts
│       │   ├── claim-extractor.ts
│       │   └── pipeline.ts
│       ├── analysis/
│       │   ├── theme-clusterer.ts
│       │   ├── relationship-mapper.ts
│       │   ├── contradiction-detector.ts
│       │   ├── gap-finder.ts
│       │   └── question-generator.ts
│       ├── ai/
│       │   ├── client.ts          (Anthropic SDK singleton)
│       │   ├── prompts.ts         (all prompt templates)
│       │   └── structured.ts      (Zod structured output helper)
│       ├── store/
│       │   ├── paper-store.ts     (in-memory + .data/ JSON persistence)
│       │   ├── analysis-store.ts
│       │   └── index.ts
│       ├── graph/
│       │   └── builder.ts         (AnalysisResult → GraphData transform)
│       └── utils/
│           ├── id.ts              (nanoid wrapper)
│           └── errors.ts          (custom error classes)
├── tests/
│   ├── setup.ts                   (testing-library/jest-dom)
│   ├── __mocks__/anthropic.ts     (mock Anthropic SDK)
│   ├── fixtures/                  (sample PDFs, JSON fixtures)
│   ├── unit/                      (mirrors src/lib/)
│   ├── integration/               (API route tests)
│   └── components/                (React component tests)
├── CLAUDE.md
├── README.md
├── biome.json
├── components.json                (shadcn config)
├── next.config.ts
├── package.json
├── tsconfig.json
└── vitest.config.mts
```

---

## API Routes

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/ingest` | Upload PDF/text file, run ingestion pipeline, return Paper |
| GET | `/api/papers` | List papers (paginated) |
| DELETE | `/api/papers` | Remove paper by id |
| POST | `/api/analyze/contradictions` | Detect contradictions across papers |
| POST | `/api/analyze/gaps` | Run theme clustering + relationship mapping + gap analysis |
| POST | `/api/analyze/questions` | Generate research questions from gaps |
| GET | `/api/graph` | Get GraphData for Cytoscape.js visualization |

All responses use `ApiResponse<T>` wrapper. All inputs validated with Zod schemas.

---

## Parallel Workstreams

### Dependency Graph

```
WS1: Infrastructure ─────────────────────┐
  │                                       │
  │ (scaffolding + types must be done     │
  │  before other streams start)          │
  ▼                                       ▼
WS2: Domain & Data    WS4: UI & Viz    WS5: QA (mocks/fixtures)
  │                     │                 │
  │ (AI client,         │ (can build      │
  │  store, claims)     │  with mock      │
  ▼                     │  data)          │
WS3: Analysis Engine ◄─┘                 │
  │                                       │
  └──────────────► WS5: Integration Tests ◄┘
```

### WS1: Infrastructure & DevOps

1. `git init`, create `.gitignore`
2. `npx create-next-app@latest . --ts --tailwind --app --src-dir --no-eslint --import-alias "@/*"`
3. Install all dependencies (see deps list below)
4. Configure Biome: `biome.json` with formatter (indent=2, line-width=100), linter (recommended), ignore `.next/`, `node_modules/`
5. Configure Vitest: `vitest.config.mts` with jsdom, react plugin, tsconfig-paths, coverage v8
6. Create `tests/setup.ts` with `@testing-library/jest-dom/vitest`
7. Initialize shadcn: `npx shadcn@latest init` (New York style, neutral base, CSS variables)
8. Install shadcn components: button, card, badge, dialog, dropdown-menu, input, progress, separator, sheet, skeleton, table, tabs, toast, tooltip, sidebar, chart
9. Configure `next.config.ts`: conditional `output: "export"` when `STATIC_EXPORT=true`, `basePath` for GitHub Pages
10. Add package.json scripts: `lint`, `lint:fix`, `format`, `typecheck`, `build:static`
11. Create `.claude/settings.json` (see below)
12. Create `CLAUDE.md` with project conventions
13. Create `README.md`
14. Create all GitHub Actions workflows (see below)
15. Implement all TypeScript interfaces in `src/lib/types/`
16. Create Zod schemas in `src/lib/schemas/`
17. Create utility modules: `src/lib/utils/id.ts`, `src/lib/utils/errors.ts`

**Dependencies to install:**
```
npm i @anthropic-ai/sdk pdf-parse zod cytoscape react-cytoscapejs recharts nanoid
npm i -D @biomejs/biome vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom vite-tsconfig-paths @types/react-cytoscapejs
```

### WS2: Domain & Data (Ingestion Pipeline)

Prereqs: WS1 steps 1-17 (scaffolding + types)

1. `src/lib/ai/client.ts` — Anthropic SDK client singleton, reads `ANTHROPIC_API_KEY` from env
2. `src/lib/ai/prompts.ts` — Prompt templates for claim extraction, metadata extraction
3. `src/lib/ai/structured.ts` — Generic `extractStructured<T>(schema, prompt)` helper with retry (3 attempts)
4. `src/lib/ingestion/pdf-extractor.ts` — `extractTextFromPdf(buffer): Promise<{text, pageCount, metadata}>` using `pdf-parse`
5. `src/lib/ingestion/text-chunker.ts` — `chunkText(text, options): Chunk[]` — split by paragraphs, target ~800 tokens/chunk, ~100 token overlap
6. `src/lib/ingestion/claim-extractor.ts` — `extractClaims(chunk, paperContext): Promise<Claim[]>` — Claude structured output with claim Zod schema
7. `src/lib/ingestion/pipeline.ts` — `ingestPaper({buffer, filename, sourceType}): Promise<Paper>` — orchestrates: extract text → parse metadata (title/authors/abstract via Claude) → chunk → extract claims (parallel batches of 3)
8. `src/lib/store/paper-store.ts` — In-memory `Map<string, Paper>` with `persist()`/`load()` to `.data/papers.json`
9. `src/lib/store/index.ts` — Export store singletons
10. `src/app/api/ingest/route.ts` — POST handler: multipart/form-data, validate file type/size, call `ingestPaper()`, return ApiResponse
11. `src/app/api/papers/route.ts` — GET: paginated list; DELETE: remove by id
12. Unit tests: `tests/unit/ingestion/pdf-extractor.test.ts`, `text-chunker.test.ts`, `claim-extractor.test.ts`, `pipeline.test.ts`

### WS3: Analysis Engine

Prereqs: WS1 types + WS2 AI client/prompts/structured helpers + store

1. `src/lib/ai/prompts.ts` — Add prompts for: theme clustering, relationship mapping, contradiction detection, gap analysis, question generation
2. `src/lib/analysis/theme-clusterer.ts` — `clusterThemes(claims): Promise<Theme[]>` — send claims to Claude for semantic clustering, compute density scores
3. `src/lib/analysis/relationship-mapper.ts` — `mapRelationships(themes, claims): Promise<Relationship[]>` — pairwise theme comparison via Claude
4. `src/lib/analysis/contradiction-detector.ts` — `detectContradictions(claims, papers): Promise<Contradiction[]>` — group claims by theme overlap, compare candidate pairs, Claude adjudication (batches of 5)
5. `src/lib/analysis/gap-finder.ts` — `findGaps(themes, relationships, contradictions): Promise<Gap[]>` — multi-strategy: unexplored intersections, sparse coverage (<0.2 density), methodological gaps, contradictory areas
6. `src/lib/analysis/question-generator.ts` — `generateQuestions(gaps, themes): Promise<ResearchQuestion[]>` — 1-3 questions per gap via Claude, priority scoring
7. `src/lib/store/analysis-store.ts` — Store for `AnalysisResult` with persistence
8. `src/lib/graph/builder.ts` — `buildGraphData(analysis): GraphData` — transform themes→nodes (size=density*80+20), relationships→edges, gaps→red dashed nodes
9. `src/app/api/analyze/contradictions/route.ts`, `gaps/route.ts`, `questions/route.ts` — POST handlers
10. `src/app/api/graph/route.ts` — GET handler returning GraphData
11. Unit tests: `tests/unit/analysis/theme-clusterer.test.ts`, `contradiction-detector.test.ts`, `gap-finder.test.ts`, `question-generator.test.ts`, `tests/unit/graph/builder.test.ts`

### WS4: UI & Visualization

Prereqs: WS1 scaffolding + shadcn + types (can use mock data until WS2/WS3 complete)

1. `src/app/globals.css` — Tailwind base, shadcn CSS variables, graph container sizing
2. `src/components/layout/providers.tsx` — Client wrapper with toast provider
3. `src/components/layout/app-sidebar.tsx` — Navigation sidebar (Dashboard, Upload, Map, Contradictions, Gaps)
4. `src/components/layout/header.tsx` — Top bar with breadcrumbs and "Run Analysis" button
5. `src/app/layout.tsx` — Root layout with sidebar, header, providers
6. `src/hooks/use-upload.ts`, `use-papers.ts`, `use-analysis.ts`, `use-graph-data.ts` — Custom hooks wrapping API calls
7. `src/components/upload/file-dropzone.tsx` — Drag-and-drop accepting PDF/TXT
8. `src/components/upload/upload-progress.tsx` — Pipeline stage progress
9. `src/components/upload/paper-list.tsx` — shadcn Table of uploaded papers
10. `src/app/upload/page.tsx` — Upload page composition
11. `src/components/map/knowledge-graph.tsx` — Cytoscape.js wrapper (`"use client"`, dynamic import with `ssr: false`), cose layout, theme nodes sized by density, gap nodes in red dashed style
12. `src/components/map/graph-controls.tsx` — Layout selector, zoom, filters
13. `src/components/map/node-detail-panel.tsx` — Slide-in panel on node click (shadcn Sheet)
14. `src/app/map/page.tsx` — Knowledge Map page
15. `src/components/contradictions/contradiction-list.tsx` — Scrollable card list with severity badges
16. `src/components/contradictions/side-by-side-view.tsx` — Two-column claim comparison
17. `src/components/contradictions/severity-badge.tsx` — Color-coded badge
18. `src/app/contradictions/page.tsx` — Contradictions page
19. `src/components/gaps/gap-list.tsx` — Gap cards with type/impact badges
20. `src/components/gaps/question-card.tsx` — Research question display with priority bar
21. `src/components/gaps/intersection-matrix.tsx` — Recharts heatmap of theme intersections
22. `src/app/gaps/page.tsx` — Gaps & Questions page
23. `src/components/dashboard/stats-cards.tsx` — 4 stat cards (papers, claims, contradictions, gaps)
24. `src/components/dashboard/density-chart.tsx` — Recharts BarChart of theme density
25. `src/components/dashboard/recent-activity.tsx` — Activity timeline
26. `src/app/page.tsx` — Dashboard page composition
27. Component tests: `tests/components/file-dropzone.test.tsx`, `knowledge-graph.test.tsx`, `contradiction-list.test.tsx`, `side-by-side-view.test.tsx`

### WS5: Integration & QA

Prereqs: WS1 for mocks/fixtures setup; WS2-WS4 for integration tests

1. `tests/__mocks__/anthropic.ts` — Mock Anthropic client with configurable responses per test, `vi.fn()` tracking
2. `tests/fixtures/sample-paper.pdf` — 2-3 page academic-style PDF
3. `tests/fixtures/sample-text.txt` — Plain text research paper
4. `tests/fixtures/extracted-claims.json` — Expected Claim[] output
5. `tests/fixtures/analysis-results.json` — Complete AnalysisResult fixture
6. `tests/fixtures/malformed.pdf` — Corrupt PDF for error handling
7. Unit tests for WS2 modules (written alongside WS2, listed above)
8. Unit tests for WS3 modules (written alongside WS3, listed above)
9. Component tests for WS4 (written alongside WS4, listed above)
10. `tests/integration/api/ingest.test.ts` — POST valid PDF, valid text, invalid type, oversized, empty body
11. `tests/integration/api/analyze.test.ts` — POST contradictions, gaps, questions; no-papers 404
12. `tests/integration/api/papers.test.ts` — GET list, DELETE paper, DELETE invalid id
13. `tests/integration/pipeline-e2e.test.ts` — Full flow: upload → ingest → analyze → graph data

---

## Configuration Files

### `.claude/settings.json`

```json
{
  "permissions": {
    "allow": [
      "Read",
      "Edit",
      "Write",
      "Grep",
      "Glob",
      "WebSearch",
      "WebFetch",
      "Bash(git:*)",
      "Bash(gh:*)",
      "Bash(curl:*)",
      "Bash(ls:*)",
      "Bash(mkdir:*)",
      "Bash(cp:*)",
      "Bash(mv:*)",
      "Bash(rm:*)",
      "Bash(cat:*)",
      "Bash(echo:*)",
      "Bash(npx:*)",
      "Bash(npm:*)",
      "Bash(node:*)",
      "Bash(python3:*)",
      "Bash(test:*)",
      "Bash(jq:*)",
      "Bash(tmux:*)",
      "mcp__plugin_chrome-devtools-mcp_chrome-devtools__navigate_page",
      "mcp__plugin_chrome-devtools-mcp_chrome-devtools__screenshot",
      "mcp__plugin_chrome-devtools-mcp_chrome-devtools__click",
      "mcp__plugin_chrome-devtools-mcp_chrome-devtools__type_text",
      "mcp__plugin_chrome-devtools-mcp_chrome-devtools__execute_javascript",
      "mcp__plugin_chrome-devtools-mcp_chrome-devtools__get_console_logs",
      "mcp__plugin_chrome-devtools-mcp_chrome-devtools__get_page_content",
      "mcp__plugin_chrome-devtools-mcp_chrome-devtools__scroll_page",
      "mcp__plugin_chrome-devtools-mcp_chrome-devtools__wait_for_navigation",
      "mcp__plugin_chrome-devtools-mcp_chrome-devtools__get_network_requests",
      "mcp__plugin_chrome-devtools-mcp_chrome-devtools__get_styles",
      "mcp__plugin_chrome-devtools-mcp_chrome-devtools__hover"
    ]
  },
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "true",
    "ENABLE_LSP_TOOL": "true"
  },
  "plansDirectory": "plans",
  "enabledPlugins": {
    "typescript-lsp@claude-plugins-official": true,
    "chrome-devtools-mcp@chrome-devtools-plugins": true
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "command": "npx @biomejs/biome format --write $CLAUDE_FILE_PATH"
      }
    ]
  }
}
```

### GitHub Actions Workflows

**`.github/workflows/ci.yml`** — Runs on push to main and all PRs:
- **lint** job: `npx biome check .`
- **typecheck** job: `npm run typecheck`
- **test** job: `npm test -- --run --coverage`, upload coverage artifact
- **build** job (needs lint+typecheck+test): `npm run build`

**`.github/workflows/deploy.yml`** — Runs on push to main:
- Build with `STATIC_EXPORT=true` and `NEXT_PUBLIC_BASE_PATH=/knowledge-gap`
- Upload pages artifact from `out/`
- Deploy via `actions/deploy-pages@v4`
- Permissions: `pages: write`, `id-token: write`, `contents: read`

**`.github/workflows/claude.yml`** — Claude Code PR review:
- Triggers on `pull_request` (opened, synchronize, reopened) and `issue_comment` (created, containing `@claude`)
- Permissions: `contents: read`, `pull-requests: write`, `issues: write`, `id-token: write`
- Uses `anthropics/claude-code-action@v1`
- `claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}`
- PR review job with prompt: `/review-pr REPO: ${{ github.repository }} PR_NUMBER: ${{ github.event.pull_request.number }}`
- `claude_args: '--allowedTools "mcp__github_inline_comment__create_inline_comment,Bash(gh pr comment:*),Bash(gh pr diff:*),Bash(gh pr view:*)"'`

### `next.config.ts`

```ts
const isStaticExport = process.env.STATIC_EXPORT === "true";
const config = {
  ...(isStaticExport && {
    output: "export",
    basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
    images: { unoptimized: true },
  }),
};
```

---

## Testing Strategy

### Mock Approach
- `tests/__mocks__/anthropic.ts` provides a `MockAnthropicClient` returning configurable fixtures
- All tests that touch AI set up the mock before running — no real API calls ever
- Fixtures in `tests/fixtures/` provide canonical test data matching the type contracts

### Key Test Cases

**Ingestion (unit):**
- PDF extraction: valid PDF returns text + page count; malformed PDF throws `ExtractionError`; empty file throws
- Chunking: 5000-word text → ~6 chunks of ~800 tokens; short text → single chunk; overlap preserved between adjacent chunks; empty text → empty array
- Claim extraction: mock Claude returns claims with correct types; chunk with no claims → empty array; retries on transient failure; persistent failure → `ClaimExtractionError`
- Pipeline: full flow returns Paper with status "ready"; extraction failure → status "error"

**Analysis (unit):**
- Theme clustering: 10 claims → 3-4 themes; single claim → single theme; density computed correctly (0-1)
- Contradiction detection: opposing claims flagged as direct_conflict; complementary claims NOT flagged; severity levels assigned; empty result when no contradictions
- Gap finding: theme pair with no relationship edge → unexplored_intersection gap; theme with density <0.2 → sparse_coverage; all same methodology → methodological_gap
- Question generation: 1-3 questions per gap with rationale; priority scores computed
- Graph builder: themes → nodes, relationships → edges, gaps → red dashed nodes; empty analysis → empty graph

**API Routes (integration):**
- POST `/api/ingest`: valid PDF → 200 with Paper; invalid type → 400; oversized → 400
- GET `/api/papers`: returns paginated list; empty → empty list
- POST `/api/analyze/gaps`: returns themes + relationships + gaps; no papers → error
- Full pipeline: upload → ingest → analyze → graph data returns valid GraphData

**Components (UI):**
- File dropzone: accepts PDF/TXT, rejects others, shows filename
- Knowledge graph: renders correct node/edge count, fires onNodeClick, handles empty data
- Contradiction list: renders items with severity badges, expands on click
- Side-by-side view: shows both claims with paper titles and resolution

---

## Verification Plan

1. **Smoke test**: `npm run dev` starts; `npm run build` succeeds; `npm run lint` clean; `npm run typecheck` clean; `npm test -- --run` all pass
2. **Ingestion flow**: Upload PDF → see progress stages → paper appears in list with claims
3. **Analysis flow**: Upload 2-3 overlapping papers → run analysis → themes appear on map → contradictions detected → gaps identified → questions generated
4. **Visualization**: Graph renders with sized nodes and edges; gap nodes are visually distinct; clicking a node opens detail panel; controls work (layout switch, zoom, filter)
5. **Dashboard**: Stats cards show correct counts; density chart renders; navigation works
6. **Edge cases**: Single paper → limited but functional analysis; malformed PDF → graceful error; no contradictions → empty list shown; no analysis yet → empty state with CTA
7. **CI/CD**: PR triggers all CI checks; merge to main triggers deploy; Claude Code reviews PRs automatically
