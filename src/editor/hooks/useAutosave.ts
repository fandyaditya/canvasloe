import { useCallback, useRef } from 'react'
import { saveElements } from '../../db/elementRepo'
import { updateCanvas } from '../../db/canvasRepo'
import { useEditorStore } from '../state/editorStore'
import type { Canvas, CanvasElement } from '../../db/schema'
import { notifyStorageUsageChanged } from '../../utils/storageUsage'

export function useAutosave() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const saveCanvas = useCallback(async (canvas: Canvas, elements: CanvasElement[]) => {
    const { setSaveStatus, cacheCanvas } = useEditorStore.getState()
    setSaveStatus('saving')
    try {
      await saveElements(canvas.id, elements)
      await updateCanvas(canvas.id, { updatedAt: Date.now() })
      cacheCanvas(canvas.id, elements)
      setSaveStatus('saved')
      notifyStorageUsageChanged()
    } catch {
      setSaveStatus('error')
    }
  }, [])

  const debouncedSave = useCallback(
    (canvas: Canvas, elements: CanvasElement[]) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      useEditorStore.getState().setSaveStatus('saving')
      timerRef.current = setTimeout(() => {
        void saveCanvas(canvas, elements)
      }, 500)
    },
    [saveCanvas],
  )

  const flushSave = useCallback(
    async (canvas: Canvas, elements: CanvasElement[]) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      await saveCanvas(canvas, elements)
    },
    [saveCanvas],
  )

  return { debouncedSave, flushSave }
}
