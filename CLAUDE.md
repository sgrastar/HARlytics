# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HARlytics is a HAR (HTTP Archive) file analysis tool built as a SvelteKit application that can be deployed both as a Chrome/Edge browser extension and as a standalone web application. All processing is done locally in the browser for privacy.

## Essential Commands

```bash
# Development
pnpm dev          # Start development server on port 5173

# Build
pnpm build        # Build for production (updates version numbers, then builds)

# Testing
pnpm test         # Run Vitest tests
pnpm test:coverage # Run tests with coverage report

# Preview
pnpm preview      # Preview production build
```

## Architecture Overview

### Component Structure
- `/src/lib/components/` - Reusable Svelte components
  - Entry components: `EntryRowGeneral.svelte`, `EntryRowCache.svelte`, etc.
  - Table components: `EntryDetailTable.svelte`, `EntryCacheTable.svelte`, etc.
  - UI components: `FilterModal.svelte`, `ExportModal.svelte`, etc.

### Core Utilities
- `/src/lib/utils.js` - Main utility functions for HAR data processing
- `/src/lib/harValidator.js` - HAR file validation and parsing
- `/src/lib/cdnAnalyzer.js` - CDN detection and analysis
- `/src/lib/chartUtils.js` - Chart data transformation utilities
- `/src/lib/sequenceDiagramGenerator.js` - Mermaid/PlantUML diagram generation

### Routing
- `/src/routes/+page.svelte` - Main application page
- `/src/routes/+layout.svelte` - App layout with theme support

### Testing
Tests use Vitest with JSDOM environment. Component tests are in `/tests/unit/components/` and utility tests in `/tests/unit/utils/`.

## Build System

The build process has two key steps:
1. `build.js` - Updates version numbers in `package.json`, `manifest.json`, and `+layout.svelte`
2. Vite build with Chrome extension adapter (configured in `svelte.config.js`)

## Key Features to Consider

- **Multiple View Modes**: Detail, Sequence, Cookie, Cache views
- **Filtering System**: Complex filtering with saved filter functionality
- **Export Capabilities**: CSV, Mermaid, PlantUML formats
- **Browser Extension**: Manifest v3 configuration in `static/manifest.json`
- **Dark Mode**: Theme switching support throughout components
- **Performance**: Large HAR file handling with virtualization considerations

## UI Framework

Uses Flowbite-Svelte components with Tailwind CSS. When adding UI elements, prefer using existing Flowbite components for consistency.