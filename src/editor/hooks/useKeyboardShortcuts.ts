import { useEffect, useRef } from 'react'
import { useEditorStore } from '../state/editorStore'
import { useHistoryStore } from '../state/historyStore'
import { useAutosave } from './useAutosave'
import { duplicateElementWithDependents, deleteElement, removeElementsFromCanvas } from '../../db/elementRepo'
import {
  copyElementsToClipboard,
  hasElementClipboard,
  pasteElementsFromClipboard,
} from '../clipboard/elementClipboard'
import { loadMarkdownContentsForElements } from './useMarkdownContent'
import { useCanvasImport } from './useCanvasImport'
import { getCanvasViewportCenter } from '../../utils/canvasCoords'

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
    return true
  }
  return false
}

export function useKeyboardShortcuts() {
  const { debouncedSave } = useAutosave()
  const { importClipboardData } = useCanvasImport()
  const skipNextPasteRef = useRef(false)

  useEffect(() => {
    const pasteAtViewportCenter = () => {
      const state = useEditorStore.getState()
      return getCanvasViewportCenter(state.canvasViewportSize, state.pan, state.zoom)
    }

    const handleKeyDown = async (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return

      const state = useEditorStore.getState()
      const { activeCanvas, elements, selectedElementIds, setElements, clearSelection, setCurrentTool } = state

      const mod = e.metaKey || e.ctrlKey

      if (mod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        if (!activeCanvas) return
        const restored = useHistoryStore.getState().undo(activeCanvas.id)
        if (restored) {
          setElements(restored)
          debouncedSave(activeCanvas, restored)
        }
        return
      }

      if ((mod && e.shiftKey && e.key === 'z') || (mod && e.key === 'y')) {
        e.preventDefault()
        if (!activeCanvas) return
        const restored = useHistoryStore.getState().redo(activeCanvas.id)
        if (restored) {
          setElements(restored)
          debouncedSave(activeCanvas, restored)
        }
        return
      }

      if (mod && e.key === 'd') {
        e.preventDefault()
        if (!activeCanvas || selectedElementIds.length !== 1) return
        const el = elements.find((x) => x.id === selectedElementIds[0])
        if (!el) return
        const copies = await duplicateElementWithDependents(el)
        const newElements = [...elements, ...copies]
        setElements(newElements)
        useHistoryStore.getState().pushHistory(activeCanvas.id, newElements)
        debouncedSave(activeCanvas, newElements)
        state.setSelectedElementIds([copies[copies.length - 1]!.id])
        return
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (state.isEditingText) return
        if (!activeCanvas || selectedElementIds.length === 0) return
        e.preventDefault()
        for (const id of selectedElementIds) {
          await deleteElement(id)
        }
        const newElements = removeElementsFromCanvas(elements, selectedElementIds)
        setElements(newElements)
        useHistoryStore.getState().pushHistory(activeCanvas.id, newElements)
        debouncedSave(activeCanvas, newElements)
        clearSelection()
        return
      }

      if (e.key === 'Escape') {
        if (state.isEditingText) return
        if (state.openMarkdownId) {
          state.setOpenMarkdownId(null)
          return
        }
        clearSelection()
        setCurrentTool('select')
        return
      }

      if (mod && (e.key === '=' || e.key === '+')) {
        e.preventDefault()
        state.setZoom(state.zoom * 1.1)
        return
      }

      if (mod && e.key === '-') {
        e.preventDefault()
        state.setZoom(state.zoom / 1.1)
        return
      }

      if (mod && e.key === 'c') {
        if (!activeCanvas || selectedElementIds.length === 0) return
        e.preventDefault()
        copyElementsToClipboard(
          elements,
          selectedElementIds,
          activeCanvas.id,
          activeCanvas.projectId,
        )
        return
      }

      if (mod && e.key === 'v') {
        if (!activeCanvas || !hasElementClipboard()) return

        e.preventDefault()
        skipNextPasteRef.current = true

        const center = pasteAtViewportCenter()
        const result = await pasteElementsFromClipboard(
          activeCanvas.projectId,
          activeCanvas.id,
          elements,
          center,
        )
        if (!result) return

        const markdownEntries = await loadMarkdownContentsForElements(result.elements)
        state.loadMarkdownCache(markdownEntries)
        setElements(result.elements)
        useHistoryStore.getState().pushHistory(activeCanvas.id, result.elements)
        debouncedSave(activeCanvas, result.elements)
        state.setSelectedElementIds(result.selectedIds)
      }
    }

    const handlePaste = async (e: ClipboardEvent) => {
      if (skipNextPasteRef.current) {
        skipNextPasteRef.current = false
        return
      }

      if (isEditableTarget(e.target)) return
      if (useEditorStore.getState().isEditingText) return

      const { activeCanvas } = useEditorStore.getState()
      if (!activeCanvas || !e.clipboardData) return

      const hasImportableData =
        e.clipboardData.files.length > 0 ||
        Array.from(e.clipboardData.items).some(
          (item) => item.type.startsWith('image/') || item.type === 'text/plain',
        ) ||
        e.clipboardData.getData('text/plain').trim().length > 0

      if (!hasImportableData) return

      e.preventDefault()

      try {
        const center = pasteAtViewportCenter()
        await importClipboardData(e.clipboardData, center.x, center.y)
      } catch (err) {
        console.error('Failed to paste external content:', err)
        useEditorStore.getState().setSaveStatus('error')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('paste', handlePaste)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('paste', handlePaste)
    }
  }, [debouncedSave, importClipboardData])
}
