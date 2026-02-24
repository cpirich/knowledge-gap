# Knowledge Gap Finder

Upload a collection of academic papers and get an interactive visual map of what's been studied vs. what hasn't. Contradictions and gap-derived research questions are surfaced automatically.

## Features

- **PDF & Text Ingestion** — Upload academic papers (PDF or plain text) and automatically extract structured claims
- **Theme Clustering** — AI-powered semantic clustering of claims into research themes with density scoring
- **Knowledge Map** — Interactive Cytoscape.js graph visualization showing themes, relationships, and gaps
- **Contradiction Detection** — Identify conflicting claims across papers with severity ratings and side-by-side comparison
- **Gap Analysis** — Find unexplored intersections, sparse coverage areas, and methodological gaps
- **Research Questions** — Auto-generated research questions derived from identified gaps, ranked by priority

## Quick Start

### Prerequisites

- Node.js v22+
- An [Anthropic API key](https://console.anthropic.com/)

### Setup

```bash
# Install dependencies
npm install

# Set your API key
export ANTHROPIC_API_KEY=sk-ant-...

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use the application.

### Usage

1. **Upload papers** — Drag and drop PDFs or text files on the Upload page
2. **Run analysis** — Click "Run Analysis" to process all uploaded papers
3. **Explore the map** — View the interactive knowledge graph on the Map page
4. **Review contradictions** — See conflicting claims with side-by-side comparison
5. **Discover gaps** — Browse identified research gaps and auto-generated questions

## Development

```bash
npm run dev        # Start dev server
npm run lint       # Lint with Biome
npm run typecheck  # TypeScript checking
npm test           # Run tests
npm run build      # Production build
```

## Static Demo

A static export is available for hosting on GitHub Pages without a server:

```bash
npm run build:static
```

This builds the app with pre-computed demo data, deployable as a static site.

## Architecture

The app is built with Next.js App Router and uses Claude AI for all intelligence features:

- **Ingestion Pipeline** — PDF extraction, text chunking, claim extraction via Claude structured outputs
- **Analysis Engine** — Theme clustering, relationship mapping, contradiction detection, gap finding, question generation
- **Visualization** — Cytoscape.js interactive graph with theme nodes sized by density and gap nodes highlighted
- **Storage** — In-memory stores with JSON file persistence (no database required)

## License

MIT
