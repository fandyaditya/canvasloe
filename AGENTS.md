# Moodboard — Agent Guide

Local-first moodboard canvas web app. Users create projects and canvases, arrange images/text/shapes/frames on an infinite canvas, and everything persists in the browser.

Read `docs/prd.md` for product requirements. This file is for implementation context.

## Commands

```bash
npm run dev          # Vite dev server
npm run build        # tsc -b && vite build
npm run lint         # oxlint
```

Always run `npm run build` after non-trivial changes.

## Tech Stack

- **React 19** + **TypeScript** + **Vite 8**
- **Konva / react-konva** — canvas rendering and interaction
- **Zustand** — editor UI state (`src/editor/state/`)
- **Dexie** — IndexedDB wrapper (`src/db/`)
- **OPFS** — image and markdown file blobs (`src/storage/opfs.ts`)
- **Tailwind CSS v4** — styling
- **Radix UI** — dialogs, menus, sliders
- **oxlint** — linting (not ESLint)

## Architecture

```
Project
  └── Canvas
        └── Elements (text, image, shape, arrow, palette, markdown, frame)
        └── Media assets (images, markdown files in OPFS)
```

### Data flow

1. **App boot** (`src/app/App.tsx`): `migrateToOpfs()` → `purgeOrphanedOpfs()` → `ensureActiveCanvas()` → load editor.
2. **Canvas load** (`useCanvasLoader`): flush previous canvas autosave, load elements from cache or IndexedDB, normalize frames.
3. **Edits**: update Zustand `elements` in memory → `useAutosave` debounces to IndexedDB → `useHistoryStore` tracks undo/redo per canvas.
4. **Media**: metadata in IndexedDB `assets` table; blobs in OPFS at `media/{projectId}/{canvasId}/{images|videos|md}/`.

### Storage split

| Layer | What |
|-------|------|
| **IndexedDB** (Dexie) | projects, canvases, elements, asset metadata |
| **OPFS** | image/markdown file blobs |
| **localStorage** | active project/canvas IDs, sidebar prefs, seed/migration flags only |

Do **not** store element data or media in localStorage. Avoid adding `pending-save-*` keys or similar.

## Project Layout

```
src/
├── app/App.tsx              # Boot, migration, seed
├── db/
│   ├── schema.ts            # All types — start here for element shapes
│   ├── db.ts                # Dexie schema
│   ├── *Repo.ts             # CRUD per entity (project, canvas, element, media)
│   ├── seed.ts              # Demo data on first run
│   └── migrateToOpfs.ts     # Legacy blob → OPFS migration
├── storage/
│   ├── opfs.ts              # OPFS read/write/list
│   └── mediaPaths.ts        # Path helpers for media files
├── editor/
│   ├── EditorShell.tsx      # Layout shell
│   ├── CanvasStage.tsx      # Konva stage, tools, drag/transform
│   ├── components/          # CanvasElements, overlays, modals
│   ├── frame/               # Frame layout, create, export PNG
│   ├── clipboard/           # Ctrl+C/V cross-canvas copy
│   ├── hooks/               # autosave, loader, shortcuts, import
│   ├── inspector/           # Right sidebar per element type
│   └── state/               # editorStore, historyStore, confirmStore
└── utils/                   # ids, image, markdown, storageUsage, confirmDelete
```

## Key Conventions

### State

- **Zustand `editorStore`** holds the active canvas, in-memory `elements`, selection, tool, zoom/pan, markdown cache.
- Call `setElements()` to replace elements — it runs `normalizeCanvasElements()` for frame safety.
- **Do not** persist elements to localStorage; use `elementRepo.saveElements` via autosave.

### Elements

- All element types extend `BaseElement` in `schema.ts`.
- **Frames** (`type: 'frame'`) own `childIds`; children are laid out by `frame/frameLayout.ts`. Always use `applyFrameLayout` / `normalizeCanvasElements` after frame mutations.
- **Images** reference `assetId`; **markdown** references `contentId` (both point to `MediaAsset` rows + OPFS files).
- Deleting elements must call `cleanupMediaForDeletedElement` or `deleteMediaIfUnreferenced`.

### Canvas interaction

- Tools: `select | rect | circle | arrow | text | color | hand | markdown | frame`
- Shift temporarily switches to hand pan; scroll+drag also pans.
- Multi-select supported; frame drag moves children imperatively in `CanvasStage` during drag.
- Keyboard shortcuts live in `hooks/useKeyboardShortcuts.ts` (undo/redo, duplicate, delete, copy/paste, zoom).

### Copy / paste

- `editor/clipboard/elementClipboard.ts` — in-memory clipboard, works across canvases.
- Cross-canvas paste duplicates OPFS media via `duplicateMediaAsset` in `mediaRepo.ts`.

### Styling

- Tailwind utility classes; design tokens like `text-text-primary`, `border-panel-border`, `bg-primary`.
- Inspectors use shared components in `inspector/shared/`.

## Adding Features

### New element type

1. Add type to `ElementType` and schema in `db/schema.ts`.
2. Render in `components/CanvasElements.tsx`.
3. Handle creation in `CanvasStage.tsx` tool logic.
4. Add inspector in `inspector/`.
5. Wire into `RightInspector.tsx`, context menu, delete/duplicate/copy paths.

### New media-backed content

1. Extend `MediaKind` and `mediaRepo.ts` create/read helpers.
2. Store blob in OPFS; metadata in `assets` table.
3. Clean up via `elementMediaCleanup.ts` on delete.
4. Call `notifyStorageUsageChanged()` after media changes.

### Frame changes

- Layout logic: `editor/frame/frameLayout.ts`
- Creation/wrapping: `editor/frame/createFrame.ts`
- Export: `editor/frame/exportFrame.ts`
- Always normalize on load (`useCanvasLoader`, `editorStore.setElements`).

## Code Style

- **Minimal scope** — smallest correct diff; don't refactor unrelated code.
- **Match existing patterns** — repo modules, naming, hook extraction level.
- **No over-engineering** — no abstractions for one-off helpers.
- **Comments** only for non-obvious business logic.
- **No tests** unless requested or clearly valuable.
- **No commits** unless the user asks.

## Common Pitfalls

- **Old frames missing fields** (e.g. `title`, `childIds`) crash Konva — use `normalizeFrame` / defaults in schema.
- **OPFS orphans** — deleting IndexedDB rows without deleting OPFS files leaks storage; use `deleteCanvasMedia` / `deleteProjectMedia` / `purgeOrphanedOpfs`.
- **Frame children** — deleting a child must update parent `childIds` and re-layout (`removeElementsFromCanvas`).
- **`duplicateElementWithDependents`** reads children from IndexedDB — in-memory-only elements need clipboard or explicit in-memory duplication.
- **Markdown content** — load into `markdownCache` when pasting or loading canvases (`loadMarkdownContentsForElements`).

## Skills

Project-local skill: `.agents/skills/agent-browser/SKILL.md` — browser automation for QA/dogfooding this web app.
