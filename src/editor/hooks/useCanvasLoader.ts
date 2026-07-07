import { useCallback } from 'react'
import { getCanvas } from '../../db/canvasRepo'
import { getElementsByCanvas } from '../../db/elementRepo'
import { useEditorStore } from '../state/editorStore'
import { useHistoryStore } from '../state/historyStore'
import { useAutosave } from './useAutosave'
import { loadMarkdownContentsForElements } from './useMarkdownContent'
import { normalizeCanvasElements } from '../frame/frameLayout'

export function useCanvasLoader() {
  const { flushSave } = useAutosave()

  const loadCanvas = useCallback(
    async (canvasId: string) => {
      const state = useEditorStore.getState()

      if (state.activeCanvas && state.activeCanvasId !== canvasId) {
        await flushSave(state.activeCanvas, state.elements)
        state.cacheCanvas(state.activeCanvasId!, state.elements)
      }

      const cached = state.getCachedCanvas(canvasId)
      const canvas = await getCanvas(canvasId)
      if (!canvas) return

      state.setActiveCanvas(canvas)
      state.clearSelection()
      state.setZoom(1)
      state.setPan({ x: 0, y: 0 })

      const rawElements = cached ? cached.elements : await getElementsByCanvas(canvasId)
      const elements = normalizeCanvasElements(rawElements)
      const markdownEntries = await loadMarkdownContentsForElements(elements)
      state.loadMarkdownCache(markdownEntries)

      if (cached) {
        state.setElements(cached.elements)
        useHistoryStore.getState().initHistory(canvasId, cached.elements)
      } else {
        state.setElements(elements)
        state.cacheCanvas(canvasId, elements)
        useHistoryStore.getState().initHistory(canvasId, elements)
      }
    },
    [flushSave],
  )

  return { loadCanvas }
}
