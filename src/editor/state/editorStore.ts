import { create } from 'zustand'
import type { Canvas, CanvasElement, SaveStatus, ShapeTool, Tool } from '../../db/schema'
import { normalizeCanvasElements } from '../frame/frameLayout'

type CanvasCache = {
  canvasId: string
  elements: CanvasElement[]
  loadedAt: number
}

type EditorStore = {
  activeProjectId: string | null
  activeCanvasId: string | null
  activeCanvas: Canvas | null
  elements: CanvasElement[]
  selectedElementIds: string[]
  currentTool: Tool
  preferredShapeTool: ShapeTool
  zoom: number
  pan: { x: number; y: number }
  isDragging: boolean
  isEditingText: boolean
  isPanning: boolean
  isShiftHandHold: boolean
  shiftHandPreviousTool: Tool | null
  isShiftKeyDown: boolean
  isScrollPanHold: boolean
  scrollPanPreviousTool: Tool | null
  saveStatus: SaveStatus
  defaultColor: string
  expandedProjects: Set<string>
  canvasCache: Map<string, CanvasCache>
  leftSidebarOpen: boolean
  rightSidebarOpen: boolean
  openMarkdownId: string | null
  canvasViewportSize: { width: number; height: number }
  markdownCache: Map<string, string>
  markdownCacheVersion: number
  opfsBrowserOpen: boolean
  contextMenu: { mode: 'element' | 'selection'; elementId?: string; x: number; y: number } | null

  setActiveProject: (id: string | null) => void
  setActiveCanvas: (canvas: Canvas | null) => void
  setActiveCanvasId: (id: string | null) => void
  setElements: (elements: CanvasElement[]) => void
  updateElementLocal: (id: string, updates: Partial<CanvasElement>) => void
  addElementLocal: (element: CanvasElement) => void
  removeElementLocal: (id: string) => void
  setSelectedElementIds: (ids: string[]) => void
  selectElement: (id: string, multi?: boolean) => void
  clearSelection: () => void
  setCurrentTool: (tool: Tool) => void
  setZoom: (zoom: number) => void
  zoomAtPoint: (factor: number, pointer: { x: number; y: number }) => void
  setPan: (pan: { x: number; y: number }) => void
  setIsDragging: (v: boolean) => void
  setIsEditingText: (v: boolean) => void
  setIsPanning: (v: boolean) => void
  setShiftKeyDown: (v: boolean) => void
  enterShiftHandHold: () => void
  exitShiftHandHold: () => void
  enterScrollPanHold: () => void
  exitScrollPanHold: () => void
  setSaveStatus: (status: SaveStatus) => void
  setDefaultColor: (color: string) => void
  toggleProjectExpanded: (projectId: string) => void
  cacheCanvas: (canvasId: string, elements: CanvasElement[]) => void
  getCachedCanvas: (canvasId: string) => CanvasCache | undefined
  setLeftSidebarOpen: (open: boolean) => void
  setRightSidebarOpen: (open: boolean) => void
  toggleLeftSidebar: () => void
  toggleRightSidebar: () => void
  setOpenMarkdownId: (id: string | null) => void
  setCanvasViewportSize: (size: { width: number; height: number }) => void
  setMarkdownContent: (contentId: string, text: string) => void
  getMarkdownContent: (contentId: string) => string | undefined
  loadMarkdownCache: (entries: Array<{ contentId: string; text: string }>) => void
  clearMarkdownCache: () => void
  setOpfsBrowserOpen: (open: boolean) => void
  setContextMenu: (menu: { mode: 'element' | 'selection'; elementId?: string; x: number; y: number } | null) => void
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  activeProjectId: localStorage.getItem('activeProjectId'),
  activeCanvasId: localStorage.getItem('activeCanvasId'),
  activeCanvas: null,
  elements: [],
  selectedElementIds: [],
  currentTool: 'select',
  preferredShapeTool: 'rect',
  zoom: 1,
  pan: { x: 0, y: 0 },
  isDragging: false,
  isEditingText: false,
  isPanning: false,
  isShiftHandHold: false,
  shiftHandPreviousTool: null,
  isShiftKeyDown: false,
  isScrollPanHold: false,
  scrollPanPreviousTool: null,
  saveStatus: 'saved',
  defaultColor: '#1E1E1E',
  expandedProjects: new Set<string>(),
  canvasCache: new Map(),
  leftSidebarOpen: localStorage.getItem('leftSidebarOpen') !== 'false',
  rightSidebarOpen: localStorage.getItem('rightSidebarOpen') !== 'false',
  openMarkdownId: null,
  canvasViewportSize: { width: 800, height: 600 },
  markdownCache: new Map(),
  markdownCacheVersion: 0,
  opfsBrowserOpen: false,
  contextMenu: null,

  setActiveProject: (id) => {
    if (id) localStorage.setItem('activeProjectId', id)
    else localStorage.removeItem('activeProjectId')
    set({ activeProjectId: id })
  },

  setActiveCanvas: (canvas) => {
    set({ activeCanvas: canvas })
    if (canvas) {
      localStorage.setItem('activeCanvasId', canvas.id)
      set({ activeCanvasId: canvas.id, activeProjectId: canvas.projectId })
      localStorage.setItem('activeProjectId', canvas.projectId)
    }
  },

  setActiveCanvasId: (id) => {
    if (id) localStorage.setItem('activeCanvasId', id)
    else localStorage.removeItem('activeCanvasId')
    set({ activeCanvasId: id })
  },

  setElements: (elements) => set({ elements: normalizeCanvasElements(elements) }),

  updateElementLocal: (id, updates) =>
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? ({ ...el, ...updates, updatedAt: Date.now() } as CanvasElement) : el,
      ),
    })),

  addElementLocal: (element) =>
    set((state) => ({ elements: [...state.elements, element] })),

  removeElementLocal: (id) =>
    set((state) => ({
      elements: state.elements.filter((el) => el.id !== id),
      selectedElementIds: state.selectedElementIds.filter((sid) => sid !== id),
    })),

  setSelectedElementIds: (ids) => set({ selectedElementIds: ids }),

  selectElement: (id, multi = false) =>
    set((state) => {
      if (multi) {
        const exists = state.selectedElementIds.includes(id)
        return {
          selectedElementIds: exists
            ? state.selectedElementIds.filter((sid) => sid !== id)
            : [...state.selectedElementIds, id],
        }
      }
      return { selectedElementIds: [id] }
    }),

  clearSelection: () => set({ selectedElementIds: [] }),

  setCurrentTool: (tool) =>
    set({
      currentTool: tool,
      ...(tool === 'rect' || tool === 'circle' || tool === 'arrow'
        ? { preferredShapeTool: tool }
        : {}),
    }),

  setZoom: (zoom) => set({ zoom: Math.min(3, Math.max(0.25, zoom)) }),

  zoomAtPoint: (factor, pointer) => {
    const { zoom, pan } = get()
    const newZoom = Math.min(3, Math.max(0.25, zoom * factor))
    if (newZoom === zoom) return
    const anchor = {
      x: (pointer.x - pan.x) / zoom,
      y: (pointer.y - pan.y) / zoom,
    }
    set({
      zoom: newZoom,
      pan: {
        x: pointer.x - anchor.x * newZoom,
        y: pointer.y - anchor.y * newZoom,
      },
    })
  },

  setPan: (pan) => set({ pan }),

  setIsDragging: (v) => set({ isDragging: v }),

  setIsEditingText: (v) => set({ isEditingText: v }),

  setIsPanning: (v) => set({ isPanning: v }),

  setShiftKeyDown: (v) => set({ isShiftKeyDown: v }),

  enterShiftHandHold: () => {
    const { isShiftHandHold, isEditingText, currentTool } = get()
    if (isShiftHandHold || isEditingText) return
    if (currentTool === 'hand') {
      set({ isShiftHandHold: true, shiftHandPreviousTool: null })
      return
    }
    set({ isShiftHandHold: true, shiftHandPreviousTool: currentTool, currentTool: 'hand' })
  },

  exitShiftHandHold: () => {
    const { isShiftHandHold, shiftHandPreviousTool } = get()
    if (!isShiftHandHold) return
    set({
      isShiftHandHold: false,
      ...(shiftHandPreviousTool !== null ? { currentTool: shiftHandPreviousTool } : {}),
      shiftHandPreviousTool: null,
    })
  },

  enterScrollPanHold: () => {
    const { isScrollPanHold, isEditingText, currentTool } = get()
    if (isScrollPanHold || isEditingText) return
    if (currentTool === 'hand') {
      set({ isScrollPanHold: true, scrollPanPreviousTool: null })
      return
    }
    set({ isScrollPanHold: true, scrollPanPreviousTool: currentTool, currentTool: 'hand' })
  },

  exitScrollPanHold: () => {
    const { isScrollPanHold, scrollPanPreviousTool, currentTool } = get()
    if (!isScrollPanHold) return
    set({
      isScrollPanHold: false,
      ...(scrollPanPreviousTool !== null && currentTool === 'hand'
        ? { currentTool: scrollPanPreviousTool }
        : {}),
      scrollPanPreviousTool: null,
    })
  },

  setSaveStatus: (status) => set({ saveStatus: status }),

  setDefaultColor: (color) => set({ defaultColor: color }),

  toggleProjectExpanded: (projectId) =>
    set((state) => {
      const next = new Set(state.expandedProjects)
      if (next.has(projectId)) next.delete(projectId)
      else next.add(projectId)
      return { expandedProjects: next }
    }),

  cacheCanvas: (canvasId, elements) => {
    const cache = new Map(get().canvasCache)
    if (cache.size >= 5) {
      const oldest = [...cache.entries()].sort((a, b) => a[1].loadedAt - b[1].loadedAt)[0]
      if (oldest) cache.delete(oldest[0])
    }
    cache.set(canvasId, { canvasId, elements, loadedAt: Date.now() })
    set({ canvasCache: cache })
  },

  getCachedCanvas: (canvasId) => get().canvasCache.get(canvasId),

  setLeftSidebarOpen: (open) => {
    localStorage.setItem('leftSidebarOpen', String(open))
    set({ leftSidebarOpen: open })
  },

  setRightSidebarOpen: (open) => {
    localStorage.setItem('rightSidebarOpen', String(open))
    set({ rightSidebarOpen: open })
  },

  toggleLeftSidebar: () => {
    const next = !get().leftSidebarOpen
    localStorage.setItem('leftSidebarOpen', String(next))
    set({ leftSidebarOpen: next })
  },

  toggleRightSidebar: () => {
    const next = !get().rightSidebarOpen
    localStorage.setItem('rightSidebarOpen', String(next))
    set({ rightSidebarOpen: next })
  },

  setOpenMarkdownId: (id) => set({ openMarkdownId: id }),

  setCanvasViewportSize: (size) => set({ canvasViewportSize: size }),

  setMarkdownContent: (contentId, text) =>
    set((state) => {
      const markdownCache = new Map(state.markdownCache)
      markdownCache.set(contentId, text)
      return { markdownCache, markdownCacheVersion: state.markdownCacheVersion + 1 }
    }),

  getMarkdownContent: (contentId) => get().markdownCache.get(contentId),

  loadMarkdownCache: (entries) =>
    set((state) => {
      const markdownCache = new Map(state.markdownCache)
      for (const { contentId, text } of entries) {
        markdownCache.set(contentId, text)
      }
      return { markdownCache, markdownCacheVersion: state.markdownCacheVersion + 1 }
    }),

  clearMarkdownCache: () => set({ markdownCache: new Map(), markdownCacheVersion: 0 }),

  setOpfsBrowserOpen: (open) => set({ opfsBrowserOpen: open }),

  setContextMenu: (menu) => set({ contextMenu: menu }),
}))
