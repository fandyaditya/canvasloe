import { useEditorStore } from '../state/editorStore'
import type { ImageElement, MarkdownElement } from '../../db/schema'
import { getMedia, readMarkdownContent, readMediaBlob } from '../../db/mediaRepo'
import { downloadBlob, downloadText } from '../../utils/download'
import { extractMarkdownTitle } from '../../utils/markdown'
import { createFrameFromSelection } from '../frame/createFrame'
import { canBeFrameChild } from '../frame/frameLayout'
import { useHistoryStore } from '../state/historyStore'
import { useAutosave } from '../hooks/useAutosave'

export function ElementContextMenu() {
  const contextMenu = useEditorStore((s) => s.contextMenu)
  const elements = useEditorStore((s) => s.elements)
  const selectedElementIds = useEditorStore((s) => s.selectedElementIds)
  const activeCanvas = useEditorStore((s) => s.activeCanvas)
  const setContextMenu = useEditorStore((s) => s.setContextMenu)
  const setElements = useEditorStore((s) => s.setElements)
  const selectElement = useEditorStore((s) => s.selectElement)
  const setRightSidebarOpen = useEditorStore((s) => s.setRightSidebarOpen)
  const { debouncedSave } = useAutosave()

  if (!contextMenu) return null

  const selectionIds =
    contextMenu.mode === 'selection'
      ? selectedElementIds
      : contextMenu.elementId && selectedElementIds.includes(contextMenu.elementId)
        ? selectedElementIds
        : contextMenu.elementId
          ? [contextMenu.elementId]
          : []

  const frameableIds = selectionIds.filter((id) => {
    const el = elements.find((e) => e.id === id)
    return el != null && canBeFrameChild(el)
  })

  const showCreateFrame = frameableIds.length >= 1 && selectionIds.length >= 1

  const element =
    contextMenu.mode === 'element' && contextMenu.elementId
      ? elements.find((el) => el.id === contextMenu.elementId)
      : undefined

  const showDownload =
    element != null && (element.type === 'image' || element.type === 'markdown') && selectionIds.length <= 1

  if (!showCreateFrame && !showDownload) return null

  const handleDownload = async () => {
    if (!element) return
    try {
      if (element.type === 'image') {
        const asset = await getMedia((element as ImageElement).assetId)
        if (!asset) return
        const blob = await readMediaBlob(asset.id)
        downloadBlob(blob, asset.filename)
      } else if (element.type === 'markdown') {
        const contentId = (element as MarkdownElement).contentId
        const asset = await getMedia(contentId)
        const text = await readMarkdownContent(contentId)
        const title = extractMarkdownTitle(text).replace(/[^\w.-]+/g, '-').toLowerCase() || 'document'
        downloadText(text, asset?.filename ?? `${title}.md`, 'text/markdown')
      }
    } finally {
      setContextMenu(null)
    }
  }

  const handleCreateFrame = async () => {
    if (!activeCanvas || frameableIds.length === 0) return
    try {
      const { frame, elements: newElements } = await createFrameFromSelection(
        activeCanvas,
        elements,
        frameableIds,
      )
      setElements(newElements)
      useHistoryStore.getState().pushHistory(activeCanvas.id, newElements)
      debouncedSave(activeCanvas, newElements)
      selectElement(frame.id)
      setRightSidebarOpen(true)
    } finally {
      setContextMenu(null)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50" onClick={() => setContextMenu(null)} />
      <div
        className="fixed z-50 min-w-[160px] overflow-hidden rounded-lg border border-panel-border bg-white py-1 shadow-lg"
        style={{ left: contextMenu.x, top: contextMenu.y }}
      >
        {showCreateFrame && (
          <button
            type="button"
            onClick={() => void handleCreateFrame()}
            className="flex w-full px-3 py-2 text-left text-sm text-text-primary hover:bg-gray-50"
          >
            Create Frame
          </button>
        )}
        {showDownload && (
          <button
            type="button"
            onClick={() => void handleDownload()}
            className="flex w-full px-3 py-2 text-left text-sm text-text-primary hover:bg-gray-50"
          >
            Download
          </button>
        )}
      </div>
    </>
  )
}
