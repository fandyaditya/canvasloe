import { useCallback } from 'react'
import { createElement } from '../../db/elementRepo'
import { createMarkdownMedia } from '../../db/mediaRepo'
import { useEditorStore } from '../state/editorStore'
import { useHistoryStore } from '../state/historyStore'
import { useAutosave } from './useAutosave'
import { useImageImport } from './useImageImport'
import { getCanvasViewportCenter, getPanToCenterRect } from '../../utils/canvasCoords'
import { isMarkdownFilename, looksLikeMarkdown } from '../../utils/markdown'
import type { CanvasElement, MarkdownElement, TextElement } from '../../db/schema'
import {
  MARKDOWN_CARD_PADDING,
  MARKDOWN_CARD_RADIUS,
  MARKDOWN_DEFAULT_SIZE,
} from '../../db/schema'

function getPlacementPoint(x?: number, y?: number) {
  const state = useEditorStore.getState()
  if (x !== undefined && y !== undefined) return { x, y }
  return getCanvasViewportCenter(state.canvasViewportSize, state.pan, state.zoom)
}

function textDimensions(text: string): { width: number; height: number; fontSize: number } {
  const lines = text.split('\n')
  const fontSize = 24
  const lineHeight = fontSize * 1.4
  const longest = lines.reduce((max, line) => Math.max(max, line.length), 0)
  const width = Math.min(480, Math.max(80, Math.ceil(longest * fontSize * 0.55)))
  const height = Math.max(lineHeight + 8, Math.ceil(lines.length * lineHeight + 8))
  return { width, height, fontSize }
}

export function useCanvasImport() {
  const { debouncedSave } = useAutosave()
  const { addImage } = useImageImport()

  const finalizeElement = useCallback(
    (element: CanvasElement) => {
      const state = useEditorStore.getState()
      const { activeCanvas, setElements, setSelectedElementIds, setPan, zoom, canvasViewportSize } =
        state
      if (!activeCanvas) return

      const newElements = [...state.elements, element]
      setElements(newElements)
      useHistoryStore.getState().pushHistory(activeCanvas.id, newElements)
      debouncedSave(activeCanvas, newElements)
      setSelectedElementIds([element.id])
      setPan(getPanToCenterRect(element, canvasViewportSize, zoom))
      state.setCurrentTool('select')
      state.setSaveStatus('saved')
    },
    [debouncedSave],
  )

  const addMarkdown = useCallback(
    async (text: string, x?: number, y?: number) => {
      const trimmed = text.trim()
      if (!trimmed) return

      const state = useEditorStore.getState()
      const { activeCanvas, activeProjectId } = state
      if (!activeCanvas || !activeProjectId) {
        state.setSaveStatus('error')
        throw new Error('Select a canvas before adding markdown')
      }

      const placement = getPlacementPoint(x, y)
      const mdMedia = await createMarkdownMedia(activeProjectId, activeCanvas.id, trimmed)
      state.setMarkdownContent(mdMedia.id, trimmed)

      const maxZ = state.elements.reduce((max, el) => Math.max(max, el.zIndex), 0)
      const element = await createElement({
        projectId: activeProjectId,
        canvasId: activeCanvas.id,
        type: 'markdown',
        x: placement.x - MARKDOWN_DEFAULT_SIZE.width / 2,
        y: placement.y - MARKDOWN_DEFAULT_SIZE.height / 2,
        width: MARKDOWN_DEFAULT_SIZE.width,
        height: MARKDOWN_DEFAULT_SIZE.height,
        rotation: 0,
        opacity: 1,
        zIndex: maxZ + 1,
        contentId: mdMedia.id,
        fontFamily: 'Inter',
        textColor: '#111827',
        backgroundColor: '#FFFFFF',
        padding: MARKDOWN_CARD_PADDING,
        radius: MARKDOWN_CARD_RADIUS,
      } as Omit<MarkdownElement, 'id' | 'createdAt' | 'updatedAt'>)

      finalizeElement(element)
      return element
    },
    [finalizeElement],
  )

  const addText = useCallback(
    async (text: string, x?: number, y?: number) => {
      const trimmed = text.trim()
      if (!trimmed) return

      const state = useEditorStore.getState()
      const { activeCanvas, activeProjectId, defaultColor } = state
      if (!activeCanvas || !activeProjectId) {
        state.setSaveStatus('error')
        throw new Error('Select a canvas before adding text')
      }

      const placement = getPlacementPoint(x, y)
      const { width, height, fontSize } = textDimensions(trimmed)
      const maxZ = state.elements.reduce((max, el) => Math.max(max, el.zIndex), 0)
      const element = await createElement({
        projectId: activeProjectId,
        canvasId: activeCanvas.id,
        type: 'text',
        x: placement.x - width / 2,
        y: placement.y - height / 2,
        width,
        height,
        rotation: 0,
        opacity: 1,
        zIndex: maxZ + 1,
        text: trimmed,
        fontFamily: 'Inter',
        fontSize,
        fontWeight: 'regular',
        italic: false,
        underline: false,
        textAlign: 'left',
        color: defaultColor,
      } as Omit<TextElement, 'id' | 'createdAt' | 'updatedAt'>)

      finalizeElement(element)
      return element
    },
    [finalizeElement],
  )

  const addTextContent = useCallback(
    async (text: string, x?: number, y?: number) => {
      if (looksLikeMarkdown(text)) return addMarkdown(text, x, y)
      return addText(text, x, y)
    },
    [addMarkdown, addText],
  )

  const importFile = useCallback(
    async (file: File, x?: number, y?: number) => {
      if (file.type.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(file.name)) {
        return addImage(file, x, y)
      }

      if (isMarkdownFilename(file.name) || file.type === 'text/markdown') {
        return addMarkdown(await file.text(), x, y)
      }

      if (file.type.startsWith('text/') || /\.(txt|md|markdown)$/i.test(file.name)) {
        return addTextContent(await file.text(), x, y)
      }

      return null
    },
    [addImage, addMarkdown, addTextContent],
  )

  const importClipboardData = useCallback(
    async (data: DataTransfer, x?: number, y?: number) => {
      const files = Array.from(data.files)
      if (files.length > 0) {
        let last: Awaited<ReturnType<typeof importFile>> = null
        for (const file of files) {
          last = await importFile(file, x, y)
        }
        return last
      }

      for (const item of Array.from(data.items)) {
        if (!item.type.startsWith('image/')) continue
        const file = item.getAsFile()
        if (!file) continue
        return addImage(file, x, y)
      }

      const text = data.getData('text/plain')
      if (text.trim()) {
        return addTextContent(text, x, y)
      }

      return null
    },
    [addImage, addTextContent, importFile],
  )

  return {
    addImage,
    addMarkdown,
    addText,
    addTextContent,
    importFile,
    importClipboardData,
  }
}
