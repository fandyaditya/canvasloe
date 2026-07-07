import { create } from 'zustand'
import type { CanvasElement, CanvasHistory, CanvasSnapshot } from '../../db/schema'

const MAX_HISTORY = 50

type HistoryStore = {
  histories: Map<string, CanvasHistory>
  initHistory: (canvasId: string, elements: CanvasElement[]) => void
  pushHistory: (canvasId: string, elements: CanvasElement[]) => void
  undo: (canvasId: string) => CanvasElement[] | null
  redo: (canvasId: string) => CanvasElement[] | null
  canUndo: (canvasId: string) => boolean
  canRedo: (canvasId: string) => boolean
}

function snapshot(elements: CanvasElement[]): CanvasSnapshot {
  return { elements: structuredClone(elements) }
}

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  histories: new Map(),

  initHistory: (canvasId, elements) => {
    const histories = new Map(get().histories)
    histories.set(canvasId, {
      past: [],
      present: snapshot(elements),
      future: [],
    })
    set({ histories })
  },

  pushHistory: (canvasId, elements) => {
    const histories = new Map(get().histories)
    const current = histories.get(canvasId)
    const present = snapshot(elements)
    if (current) {
      const past = [...current.past, current.present].slice(-MAX_HISTORY)
      histories.set(canvasId, { past, present, future: [] })
    } else {
      histories.set(canvasId, { past: [], present, future: [] })
    }
    set({ histories })
  },

  undo: (canvasId) => {
    const histories = new Map(get().histories)
    const current = histories.get(canvasId)
    if (!current || current.past.length === 0) return null
    const previous = current.past[current.past.length - 1]
    const past = current.past.slice(0, -1)
    const future = [current.present, ...current.future]
    histories.set(canvasId, { past, present: previous, future })
    set({ histories })
    return previous.elements
  },

  redo: (canvasId) => {
    const histories = new Map(get().histories)
    const current = histories.get(canvasId)
    if (!current || current.future.length === 0) return null
    const next = current.future[0]
    const future = current.future.slice(1)
    const past = [...current.past, current.present]
    histories.set(canvasId, { past, present: next, future })
    set({ histories })
    return next.elements
  },

  canUndo: (canvasId) => {
    const current = get().histories.get(canvasId)
    return (current?.past.length ?? 0) > 0
  },

  canRedo: (canvasId) => {
    const current = get().histories.get(canvasId)
    return (current?.future.length ?? 0) > 0
  },
}))
