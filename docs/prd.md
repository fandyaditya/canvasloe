# PRD: Local Moodboard Canvas Web App

## 1. Product Summary

The product is a simple local-first moodboard canvas web app for quickly creating visual boards using images, text, shapes, arrows, and colors.

The main goal is speed: users should be able to move between projects and canvases instantly, paste or drag images into the canvas, resize items, and make quick visual compositions without needing accounts, cloud sync, or a backend.

The app is fully local. Projects, canvases, elements, and image assets are stored in the browser using local storage technology.

---

## 2. Core Concept

The app hierarchy is:

```txt
Project
  └── Canvas
        └── Asset / Element
```

A user can have multiple projects.

Each project can contain multiple canvases.

Each canvas contains editable elements such as:

```txt
Text
Image
Rectangle
Circle
Arrow
```

The app should feel like a lightweight local version of a moodboard/design board tool, not a heavy professional design editor.

---

## 3. Product Goals

### Primary Goals

1. Let users create and manage projects locally.
2. Let users create multiple canvases inside each project.
3. Let users switch between canvases quickly.
4. Let users drag and drop images into the canvas.
5. Let users paste images directly using `Cmd/Ctrl + V`.
6. Let users create simple visual elements:

   * text
   * square/rectangle
   * circle
   * arrow
7. Let users style selected elements through a clean right sidebar.
8. Save all work automatically in local browser storage.
9. Keep the UI simple, clean, and fast.

---

## 4. Non-Goals

The MVP will not include:

```txt
Cloud sync
User accounts
Team collaboration
Comments
Backend server
AI image generation
Advanced vector editing
Export to PNG/PDF
Public sharing links
Template marketplace
Multi-device sync
```

These can be added later, but the first version should stay local, simple, and fast.

---

## 5. Target User

The target user is someone who wants to quickly arrange visual ideas:

```txt
Brand moodboard
Interior moodboard
App design inspiration
Color palette board
Typography exploration
Landing page reference board
Product concept board
```

The user wants speed and simplicity more than complex design-tool features.

---

## 6. Main User Flow

### 6.1 Create Project

```txt
User opens app
→ sees left sidebar
→ clicks + beside Projects
→ creates new project folder
→ project appears in sidebar
```

### 6.2 Create Canvas

```txt
User clicks + beside a project folder
→ new canvas is created inside that project
→ canvas opens immediately
```

Canvas creation should happen from the **project folder**, not from a bottom canvas bar.

### 6.3 Add Image

User can add an image in three ways:

```txt
Drag image file into canvas
Paste image from clipboard using Cmd/Ctrl + V
Use image upload button
```

When the image is added:

```txt
Image is stored locally
Image element is created on the canvas
User can drag, resize, rotate, and style it
```

### 6.4 Add Shape

```txt
User selects rectangle/circle tool
→ clicks or drags on canvas
→ shape is created
→ right sidebar updates to shape controls
```

### 6.5 Add Text

```txt
User selects text tool
→ clicks canvas
→ text element appears
→ user edits text
→ right sidebar updates to text controls
```

### 6.6 Add Arrow

```txt
User selects arrow tool
→ drags from start point to end point
→ arrow appears
→ right sidebar updates to arrow controls
```

### 6.7 Switch Canvas

```txt
User clicks another canvas in left sidebar
→ current canvas autosaves
→ selected canvas loads
→ canvas elements render instantly
```

Canvas switching must feel smooth and fast.

---

## 7. App Layout

The app uses a three-panel layout.

```txt
┌──────────────────────────────────────────────────────────────┐
│ Top Bar                                                      │
├───────────────┬───────────────────────────────┬──────────────┤
│ Left Sidebar  │ Main Canvas                   │ Right Sidebar│
│               │                               │              │
│ Projects      │ Moodboard editing area        │ Inspector    │
│ Canvas list   │                               │              │
└───────────────┴───────────────────────────────┴──────────────┘
```

---

## 8. Left Sidebar

The left sidebar is for project and canvas navigation.

### Content

```txt
App logo / Moodboard name
Projects title
Project folders
Canvas items inside each project
Local storage status
Settings
```

### Project Folder

Each project folder shows:

```txt
Folder icon
Project name
Canvas count
Expand/collapse button
+ button to create canvas
```

Example:

```txt
Studio Project       [+]
  Brand Direction
  Moodboard
  Color & Typography
  Logo Ideas
```

The `+` button beside the project creates a new canvas inside that project.

---

## 9. Top Bar

The top bar should stay minimal.

### Suggested Controls

```txt
Current canvas name
Undo
Redo
Zoom out
Zoom percentage
Zoom in
Pan/hand tool
Autosave status
Optional share/export button later
```

For MVP, share/export can be hidden or disabled.

---

## 10. Main Canvas

The main canvas is where the user creates the moodboard.

### Canvas Requirements

```txt
Large editable canvas area
Subtle dot grid background
Smooth pan and zoom
Object selection
Object dragging
Object resizing
Object rotation
Multi-layer rendering
Keyboard shortcuts
```

### Elements Supported

```txt
Text
Image
Rectangle
Circle
Arrow
```

### Selection Behavior

When an element is selected:

```txt
Show selection outline
Show resize handles
Show rotate handle
Show small floating object toolbar if needed
Update right sidebar based on selected element type
```

---

## 11. Right Sidebar

The right sidebar is context-aware.

It changes depending on the selected element type.

There should be no separate `Arrange` and `Transform` tabs in the simplified MVP. Those controls can be either removed or placed as small actions inside each element panel.

The right sidebar should show only the most useful controls for the selected component.

---

# 12. Right Sidebar States

## 12.1 No Selection State

When nothing is selected, show simple canvas settings.

### Controls

```txt
Canvas name
Canvas width
Canvas height
Background color
Grid/dot background toggle
Delete canvas
```

---

## 12.2 Text Selected

When a text element is selected, show:

### Text Panel

```txt
Content input

Typography:
- Font family
- Font size
- Font weight
- Bold
- Italic
- Underline

Text align:
- Left
- Center
- Right

Text color:
- Color picker
- Opacity

Element actions:
- Duplicate
- Lock
- Delete
```

### Optional Later

```txt
Line height
Letter spacing
Text box background
Text box border
Text box radius
```

---

## 12.3 Image Selected

When an image element is selected, show:

### Image Panel

```txt
Image preview
Replace image
Delete image

Fit:
- Contain
- Cover
- Stretch

Corner radius
Opacity

Element actions:
- Duplicate
- Lock
- Delete
```

### Optional Later

```txt
Crop
Reset crop
Brightness
Contrast
Saturation
Shadow
Border
```

---

## 12.4 Shape Selected

For rectangle and circle elements, show:

### Shape Panel

```txt
Fill color
Fill opacity

Stroke color
Stroke opacity
Stroke width

Corner radius
Only for rectangle

Opacity

Element actions:
- Duplicate
- Lock
- Delete
```

For circle, hide the corner radius control.

---

## 12.5 Arrow Selected

For arrow elements, show:

### Arrow Panel

```txt
Stroke color
Stroke opacity
Stroke width

Arrowheads:
- Start arrowhead toggle
- End arrowhead toggle

Line style:
- Solid
- Dashed

Opacity

Element actions:
- Duplicate
- Lock
- Delete
```

### Optional Later

```txt
Arrowhead size
Curved arrow
Elbow arrow
Line cap
Line join
```

---

## 13. Toolbar

The main tool palette should be floating on the left side of the canvas.

### Tools

```txt
Select
Rectangle
Circle
Arrow
Text
Color picker
More
```

Image upload can be inside `More`, or added as a direct icon later.

### Tool Behavior

```txt
Select:
- click element to select
- drag element to move

Rectangle:
- click-drag creates rectangle

Circle:
- click-drag creates circle/ellipse

Arrow:
- drag from start point to end point

Text:
- click canvas to create text

Color:
- if element selected, apply color
- if no element selected, update default style
```

---

## 14. Keyboard Shortcuts

### Required MVP Shortcuts

```txt
Cmd/Ctrl + Z       Undo
Cmd/Ctrl + Shift + Z / Ctrl + Y   Redo
Cmd/Ctrl + C       Copy selected element
Cmd/Ctrl + V       Paste element or pasted image
Backspace/Delete   Delete selected element
Cmd/Ctrl + D       Duplicate selected element
Esc                Deselect / exit current tool
Space + drag       Pan canvas
Cmd/Ctrl + +       Zoom in
Cmd/Ctrl + -       Zoom out
```

---

## 15. Undo / Redo

Konva does not provide full built-in design-editor undo/redo. The app should manage undo/redo in its own state. Konva’s official React guide recommends storing history in application state for undo/redo behavior.

### MVP Approach

Use snapshot-based history per canvas.

```ts
type CanvasHistory = {
  past: CanvasSnapshot[];
  present: CanvasSnapshot;
  future: CanvasSnapshot[];
};

type CanvasSnapshot = {
  elements: CanvasElement[];
};
```

### Undo Flow

```txt
Take previous snapshot from past
Move current snapshot into future
Set previous snapshot as current canvas state
Render canvas again
```

### Redo Flow

```txt
Take next snapshot from future
Move current snapshot into past
Set next snapshot as current canvas state
Render canvas again
```

### When to Create History Entry

Create history entries only after committed actions:

```txt
After drag end
After resize end
After rotate end
After text edit finished
After color change
After create element
After delete element
After duplicate element
```

Do not create a history entry on every mouse movement.

---

## 16. Autosave

The app should autosave locally.

### Autosave Rules

```txt
Autosave after element changes
Debounce save by 300–800ms
Save immediately before switching canvas
Save immediately before closing tab if possible
Show "All changes saved" status in top bar
```

### Do Not

```txt
Do not save every mousemove
Do not store image as base64 unless necessary
Do not reload the whole app when switching canvas
```

---

## 17. Local Storage Strategy

Use IndexedDB for real app data.

IndexedDB is suitable for significant client-side structured data, including files and blobs, while Web Storage is better for smaller data.

### Storage Choice

```txt
IndexedDB:
- projects
- canvases
- elements
- image assets
- canvas thumbnails

localStorage:
- active project id
- active canvas id
- UI preferences
- theme setting
```

### Recommended Library

Use Dexie.js as a wrapper around IndexedDB.

Dexie provides a simpler promise-based API over IndexedDB, and its React hooks can observe IndexedDB data and re-render components when data changes.

---

## 18. Technical Stack

### Frontend

```txt
React
TypeScript
Vite
```

React is suitable because the app is component-heavy: sidebar, toolbar, right inspector, project list, modals, and canvas shell. React’s component model is designed for building UI from reusable pieces.

### Canvas Engine

```txt
Konva
react-konva
```

Konva supports objects such as rectangles, circles, lines, text, images, layers, events, drag/drop, resize, and rotation. `react-konva` gives React bindings for building canvas apps with React-style components.

### Local Database

```txt
Dexie.js
IndexedDB
```

### UI State

```txt
Zustand
```

Zustand is a small and scalable React state management library with a hook-based API.

### Styling

```txt
Tailwind CSS
Radix UI or shadcn/ui primitives
Lucide React icons
```

### Optional Later

```txt
OPFS for heavier local file storage
Service worker for offline PWA mode
Export/import project backup as JSON + image blobs
```

---

## 19. Suggested Folder Structure

```txt
src/
  app/
    App.tsx
    providers.tsx

  db/
    db.ts
    schema.ts
    projectRepo.ts
    canvasRepo.ts
    elementRepo.ts
    assetRepo.ts

  editor/
    EditorShell.tsx
    TopBar.tsx
    LeftSidebar.tsx
    CanvasStage.tsx
    FloatingToolbar.tsx
    RightInspector.tsx

  editor/components/
    TextElement.tsx
    ImageElement.tsx
    ShapeElement.tsx
    ArrowElement.tsx
    SelectionTransformer.tsx

  editor/inspector/
    EmptyInspector.tsx
    TextInspector.tsx
    ImageInspector.tsx
    ShapeInspector.tsx
    ArrowInspector.tsx

  editor/tools/
    selectTool.ts
    textTool.ts
    shapeTool.ts
    arrowTool.ts
    imageTool.ts
    colorTool.ts

  editor/state/
    editorStore.ts
    historyStore.ts
    selectionStore.ts

  editor/hooks/
    useActiveProject.ts
    useActiveCanvas.ts
    useAutosave.ts
    useClipboardImage.ts
    useDropImage.ts
    useKeyboardShortcuts.ts

  utils/
    ids.ts
    image.ts
    canvas.ts
    objectUrlCache.ts
    thumbnails.ts
```

---

## 20. Data Model

### Project

```ts
type Project = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
};
```

### Canvas

```ts
type Canvas = {
  id: string;
  projectId: string;
  name: string;
  width: number;
  height: number;
  background: string;
  gridEnabled: boolean;
  thumbnailAssetId?: string;
  createdAt: number;
  updatedAt: number;
};
```

### Base Element

```ts
type BaseElement = {
  id: string;
  projectId: string;
  canvasId: string;
  type: "text" | "image" | "shape" | "arrow";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  locked?: boolean;
  hidden?: boolean;
  createdAt: number;
  updatedAt: number;
};
```

### Text Element

```ts
type TextElement = BaseElement & {
  type: "text";
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: "regular" | "medium" | "semibold" | "bold";
  italic: boolean;
  underline: boolean;
  textAlign: "left" | "center" | "right";
  color: string;
};
```

### Image Element

```ts
type ImageElement = BaseElement & {
  type: "image";
  assetId: string;
  fit: "contain" | "cover" | "stretch";
  radius: number;
};
```

### Shape Element

```ts
type ShapeElement = BaseElement & {
  type: "shape";
  shape: "rect" | "circle";
  fill: string;
  fillOpacity: number;
  stroke: string;
  strokeOpacity: number;
  strokeWidth: number;
  radius?: number;
};
```

### Arrow Element

```ts
type ArrowElement = BaseElement & {
  type: "arrow";
  stroke: string;
  strokeOpacity: number;
  strokeWidth: number;
  dashed: boolean;
  startHead: boolean;
  endHead: boolean;
};
```

### Image Asset

```ts
type ImageAsset = {
  id: string;
  projectId: string;
  canvasId?: string;
  mimeType: string;
  width: number;
  height: number;
  blob: Blob;
  createdAt: number;
};
```

---

## 21. IndexedDB Tables

Using Dexie:

```ts
db.version(1).stores({
  projects: "id, name, updatedAt",
  canvases: "id, projectId, name, updatedAt",
  elements: "id, projectId, canvasId, type, zIndex, updatedAt",
  assets: "id, projectId, canvasId, mimeType, createdAt",
  thumbnails: "id, projectId, canvasId, updatedAt"
});
```

---

## 22. State Management

Use Zustand for temporary editor state.

### Editor Store

```ts
type EditorStore = {
  activeProjectId: string | null;
  activeCanvasId: string | null;
  selectedElementIds: string[];
  currentTool: "select" | "rect" | "circle" | "arrow" | "text" | "color";
  zoom: number;
  pan: { x: number; y: number };
  isDragging: boolean;
  isEditingText: boolean;
};
```

### Persistent State

Persistent state should live in IndexedDB:

```txt
Projects
Canvases
Elements
Image assets
Thumbnails
```

### Temporary State

Temporary state should live in Zustand:

```txt
Selected element
Current tool
Zoom
Pan
Hover state
Dragging state
Text editing state
Undo/redo stack
```

---

## 23. Image Handling

### Drag and Drop Flow

```txt
User drops image file onto canvas
→ app reads file as Blob
→ create object URL for immediate preview
→ detect image width and height
→ save Blob to IndexedDB
→ create ImageElement
→ render image on canvas
```

### Clipboard Paste Flow

```txt
User presses Cmd/Ctrl + V
→ app checks clipboard items
→ if image exists, read image Blob
→ save Blob to IndexedDB
→ create ImageElement at canvas center or mouse position
```

### Image Cache

Use runtime cache for object URLs:

```ts
const objectUrlCache = new Map<string, string>();
const imageElementCache = new Map<string, HTMLImageElement>();
```

When an image asset is loaded:

```txt
Blob from IndexedDB
→ URL.createObjectURL(blob)
→ cache object URL
→ use it in Konva image element
```

Clean up object URLs when the app closes or asset is removed.

---

## 24. Fast Canvas Switching

Fast switching is one of the most important product requirements.

### Required Behavior

```txt
Click canvas in left sidebar
→ save current canvas
→ update activeCanvasId
→ load selected canvas elements
→ lazy-load image blobs for selected canvas
→ render immediately
```

### Performance Rules

```txt
Load only the active canvas elements
Do not load every asset from every project at startup
Cache recently opened canvases
Cache image object URLs
Debounce autosave
Avoid full React tree remount when switching canvas
```

### Suggested Cache

```ts
type CanvasCache = {
  canvasId: string;
  elements: CanvasElement[];
  loadedAt: number;
};

const recentCanvasCache = new Map<string, CanvasCache>();
```

Keep the latest 3–5 opened canvases in memory.

---

## 25. Canvas Rendering Rules

### Layering

Elements render by `zIndex`.

```txt
Lower zIndex = behind
Higher zIndex = in front
```

### Selection

```txt
Selected element shows bounding box
Selected element shows resize handles
Selected element can be rotated
Locked element cannot be moved or edited
Hidden element does not render
```

### Transform

For MVP, transform controls can be canvas-only.

Users resize and move elements directly on canvas instead of using a separate transform tab.

---

## 26. Arrange Controls

Arrange does not need a separate tab in the MVP.

Use small actions in the selected element toolbar or right sidebar footer:

```txt
Bring forward
Send backward
Duplicate
Lock
Delete
```

Advanced alignment can come later:

```txt
Align left
Align center
Align right
Align top
Align middle
Align bottom
Distribute horizontally
Distribute vertically
```

---

## 27. Design Direction

### Visual Style

```txt
Clean
Minimal
White/neutral background
Light borders
Soft shadows
Purple accent
Large empty canvas space
Simple controls
```

### Layout Rules

```txt
Left sidebar fixed width: 260px
Right sidebar fixed width: 300–340px
Top bar height: 64px
Canvas background: off-white with subtle dot grid
Toolbar: floating vertical pill
```

### Color Palette

```txt
Primary accent: #5B4DFF
Primary hover: #4738E8
Background: #FFFFFF
Canvas background: #FAFAFB
Panel border: #E5E7EB
Text primary: #111827
Text secondary: #6B7280
Danger: #EF4444
Success: #22C55E
```

### Typography

```txt
UI font: Inter or system font
Canvas default text font: Playfair Display or Inter
Base UI size: 14px
Sidebar item size: 14px
Panel label size: 12–13px
```

---

## 28. MVP Feature Checklist

### Project / Canvas

```txt
Create project
Rename project
Delete project
Create canvas from project +
Rename canvas
Delete canvas
Switch canvas
Autosave canvas
```

### Canvas Editor

```txt
Pan
Zoom
Select element
Move element
Resize element
Rotate element
Delete element
Duplicate element
Undo
Redo
```

### Elements

```txt
Add text
Edit text
Add rectangle
Add circle
Add arrow
Add image by drag/drop
Add image by paste
Resize image
Replace image
```

### Inspector

```txt
Text inspector
Image inspector
Shape inspector
Arrow inspector
Canvas inspector when nothing selected
```

### Storage

```txt
Store projects locally
Store canvases locally
Store elements locally
Store image blobs locally
Store recent active project/canvas
```

---

## 29. Later Features

After MVP, consider:

```txt
Canvas thumbnail generation
Project import/export
Snap guides
Multi-select
Group/ungroup
Layer panel
Canvas templates
Color palette extraction from image
Image crop
Image filters
PWA offline install
Local file system backup
OPFS storage mode
```

---

## 30. Technical Implementation Phases

### Phase 1: App Shell and Local Data

```txt
Set up React + TypeScript + Vite
Set up Tailwind
Set up Dexie database
Create project sidebar
Create canvas list
Create new project
Create new canvas from project +
Persist project/canvas data
```

### Phase 2: Canvas Rendering

```txt
Set up Konva Stage
Render active canvas
Render text, shape, arrow, image elements
Implement selection
Implement drag/move
Implement resize/rotate transformer
```

### Phase 3: Inspector Panels

```txt
Create RightInspector component
Create EmptyInspector
Create TextInspector
Create ImageInspector
Create ShapeInspector
Create ArrowInspector
Bind inspector controls to selected element state
```

### Phase 4: Image Input

```txt
Add drag/drop image support
Add clipboard paste image support
Save image Blob to IndexedDB
Load image Blob as object URL
Render image on canvas
```

### Phase 5: Undo, Redo, Autosave

```txt
Create canvas history store
Implement undo/redo shortcuts
Debounce autosave
Save before canvas switching
Show autosave status
```

### Phase 6: Polish

```txt
Zoom controls
Pan tool
Keyboard shortcuts
Duplicate/delete/lock
Recent canvas cache
Canvas thumbnails
Better empty states
```

---

## 31. Recommended Final Stack

```txt
Framework: React
Language: TypeScript
Build tool: Vite
Canvas: Konva + react-konva
State: Zustand
Database: IndexedDB
DB wrapper: Dexie.js
Styling: Tailwind CSS
UI primitives: Radix UI or shadcn/ui
Icons: Lucide React
ID generation: nanoid
```

---

## 32. Final Product Direction

The product should feel like:

```txt
A fast local moodboard canvas
Simple like a notes app
Flexible like a mini design board
No login
No backend
No clutter
Fast canvas switching
Easy image paste/drop
Simple right sidebar based on selected component
```

The strongest UX principle is:

```txt
Everything important should happen directly on the canvas.
The right sidebar should only help style the selected object.
```
