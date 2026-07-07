# Moodboard

A local-first moodboard canvas for quickly arranging visual ideas — images, text, shapes, color palettes, markdown notes, and frames. No accounts, no backend, no cloud sync. Everything stays in your browser.

## Features

- **Projects & canvases** — organize boards in a left sidebar; switch instantly
- **Canvas elements** — text, images, rectangles, circles, arrows, color palettes, markdown cards, frames
- **Frames** — group elements in a grid layout with optional title; export frame as PNG
- **Drag & drop** — drop images onto the canvas
- **Autosave** — edits persist automatically to IndexedDB + OPFS
- **Undo / redo** — per canvas
- **Copy / paste** — multi-select, frames, and cross-canvas paste (`Ctrl+C` / `Ctrl+V`)
- **Inspector** — style selected elements in the right sidebar

## Getting Started

**Requirements:** Node.js 20+, a Chromium-based browser (for OPFS)

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

### Other commands

```bash
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Run oxlint
npm run dev:persist  # Dev server with a persistent browser profile
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` or `Ctrl/Cmd + Y` | Redo |
| `Ctrl/Cmd + C` | Copy selection |
| `Ctrl/Cmd + V` | Paste (elements or image from clipboard) |
| `Ctrl/Cmd + D` | Duplicate selection |
| `Ctrl/Cmd + +` | Zoom in |
| `Ctrl/Cmd + -` | Zoom out |
| `Delete` / `Backspace` | Delete selection |
| `Escape` | Clear selection / close modal |
| `Shift` (hold) | Temporary hand tool (pan) |

## Data & Privacy

All data is stored locally in your browser:

| Storage | Contents |
|---------|----------|
| **IndexedDB** | Projects, canvases, element metadata |
| **OPFS** | Image and markdown file blobs |
| **localStorage** | UI preferences and active project/canvas IDs |

Storage usage is shown in the left sidebar (IndexedDB, OPFS, localStorage breakdown).

Clearing site data in your browser removes all projects. There is no export/import yet — back up by not clearing browser storage.

## Tech Stack

React 19 · TypeScript · Vite · Konva · Zustand · Dexie · Tailwind CSS · Radix UI

## Project Docs

- [`prd.md`](./prd.md) — product requirements
- [`AGENTS.md`](./AGENTS.md) — architecture and conventions for contributors / AI agents

## Browser Support

Requires a modern browser with **IndexedDB** and **Origin Private File System (OPFS)**. Chrome and Edge are recommended.
