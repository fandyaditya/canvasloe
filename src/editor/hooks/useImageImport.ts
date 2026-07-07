import { useCallback } from 'react'
import { createAsset } from '../../db/assetRepo'
import { createElement } from '../../db/elementRepo'
import { useEditorStore } from '../state/editorStore'
import { useHistoryStore } from '../state/historyStore'
import { useAutosave } from './useAutosave'
import { getCanvasViewportCenter, getPanToCenterRect, normalizeImageFile } from '../../utils/canvasCoords'
import { getImageDimensions } from '../../utils/image'
import { getImageElement } from '../../utils/objectUrlCache'
import type { ImageElement } from '../../db/schema'

export function useImageImport() {
  const { debouncedSave } = useAutosave()

  const addImage = useCallback(
    async (file: File, x?: number, y?: number) => {
      const state = useEditorStore.getState()
      const {
        activeCanvas,
        activeProjectId,
        setElements,
        setSelectedElementIds,
        setPan,
        pan,
        zoom,
        canvasViewportSize,
        setSaveStatus,
      } = state

      if (!activeCanvas || !activeProjectId) {
        setSaveStatus('error')
        throw new Error('Select a canvas before uploading an image')
      }

      if (file.size === 0) {
        setSaveStatus('error')
        throw new Error('Image file is empty')
      }

      const blob = normalizeImageFile(file)
      const placement =
        x !== undefined && y !== undefined
          ? { x, y }
          : getCanvasViewportCenter(canvasViewportSize, pan, zoom)

      const { width: naturalWidth, height: naturalHeight } = await getImageDimensions(blob)
      const maxSize = 400
      const scale = Math.min(1, maxSize / Math.max(naturalWidth, naturalHeight))
      const width = naturalWidth * scale
      const height = naturalHeight * scale

      const asset = await createAsset({
        projectId: activeProjectId,
        canvasId: activeCanvas.id,
        mimeType: blob.type || file.type || 'image/png',
        width: naturalWidth,
        height: naturalHeight,
        blob,
      })

      await getImageElement(asset.id, blob)

      const elements = useEditorStore.getState().elements
      const maxZ = elements.reduce((m, el) => Math.max(m, el.zIndex), 0)
      const element = await createElement({
        projectId: activeProjectId,
        canvasId: activeCanvas.id,
        type: 'image',
        x: placement.x - width / 2,
        y: placement.y - height / 2,
        width,
        height,
        rotation: 0,
        opacity: 1,
        zIndex: maxZ + 1,
        assetId: asset.id,
        fit: 'contain',
        radius: 8,
        caption: '',
      } as Omit<ImageElement, 'id' | 'createdAt' | 'updatedAt'>)

      const newElements = [...useEditorStore.getState().elements, element]
      setElements(newElements)
      useHistoryStore.getState().pushHistory(activeCanvas.id, newElements)
      debouncedSave(activeCanvas, newElements)
      setSelectedElementIds([element.id])
      setPan(getPanToCenterRect(element, canvasViewportSize, zoom))
      setSaveStatus('saved')
      return element
    },
    [debouncedSave],
  )

  return { addImage }
}
