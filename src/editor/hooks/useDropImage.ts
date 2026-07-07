import { useCallback } from 'react'
import { useEditorStore } from '../state/editorStore'
import { clientToCanvasPoint } from '../../utils/canvasCoords'
import { useCanvasImport } from './useCanvasImport'

export function useDropImage(containerRef: React.RefObject<HTMLElement | null>) {
  const { importFile } = useCanvasImport()

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const file = e.dataTransfer.files[0]
      if (!file) return

      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return

      const { pan, zoom } = useEditorStore.getState()
      const point = clientToCanvasPoint(e.clientX, e.clientY, rect, pan, zoom)
      await importFile(file, point.x, point.y)
    },
    [importFile, containerRef],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  return { handleDrop, handleDragOver }
}
