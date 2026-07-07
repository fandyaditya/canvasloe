import { useEffect } from 'react'
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
import { useImageImport } from './useImageImport'

export function useKeyboardShortcuts() {
  const { debouncedSave } = useAutosave()
  const { addImage } = useImageImport()

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return

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
        e.preventDefault()
        if (activeCanvas && hasElementClipboard()) {
          const centerX =
            (window.innerWidth - 580) / 2 / state.zoom - state.pan.x
          const centerY =
            (window.innerHeight - 64) / 2 / state.zoom - state.pan.y
          const result = await pasteElementsFromClipboard(
            activeCanvas.projectId,
            activeCanvas.id,
            elements,
            { x: centerX, y: centerY },
          )
          if (result) {
            const markdownEntries = await loadMarkdownContentsForElements(result.elements)
            state.loadMarkdownCache(markdownEntries)
            setElements(result.elements)
            useHistoryStore.getState().pushHistory(activeCanvas.id, result.elements)
            debouncedSave(activeCanvas, result.elements)
            state.setSelectedElementIds(result.selectedIds)
          }
          return
        }

        try {
          const items = await navigator.clipboard.read()
          for (const item of items) {
            const imageType = item.types.find((t) => t.startsWith('image/'))
            if (imageType) {
              const blob = await item.getType(imageType)
              const file = new File([blob], 'pasted.png', { type: imageType })
              const centerX = (window.innerWidth - 580) / 2 / state.zoom - state.pan.x
              const centerY = (window.innerHeight - 64) / 2 / state.zoom - state.pan.y
              await addImage(file, centerX, centerY)
              return
            }
          }
        } catch {
          // clipboard access denied
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [debouncedSave, addImage])
}
