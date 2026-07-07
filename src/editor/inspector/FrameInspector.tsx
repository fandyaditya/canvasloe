import { useState } from 'react'
import { Frame, GripVertical, ImageIcon, Type, Square, FileText, Droplet, X, Download } from 'lucide-react'
import { InspectorHeader, SectionLabel, ElementActions } from './shared'
import type { CanvasElement, FrameElement } from '../../db/schema'
import { FRAME_MAX_CHILDREN } from '../../db/schema'
import { useEditorStore } from '../state/editorStore'
import { useAutosave } from '../hooks/useAutosave'
import { useHistoryStore } from '../state/historyStore'
import { deleteElement, duplicateElementWithDependents } from '../../db/elementRepo'
import { applyFrameLayout } from '../frame/frameLayout'
import { removeChildFromFrame, reorderFrameChildren } from '../frame/createFrame'
import { exportFrameToPng } from '../frame/exportFrame'
import { downloadBlob } from '../../utils/download'
function childLabel(el: CanvasElement): string {
  switch (el.type) {
    case 'text':
      return el.text.slice(0, 40) || 'Text'
    case 'image':
      return 'Image'
    case 'shape':
      return el.shape === 'circle' ? 'Circle' : 'Rectangle'
    case 'markdown':
      return 'Markdown'
    case 'palette':
      return 'Colour palette'
    default:
      return el.type
  }
}

function ChildIcon({ type }: { type: CanvasElement['type'] }) {
  const cls = 'h-3.5 w-3.5 shrink-0 text-text-secondary'
  switch (type) {
    case 'image':
      return <ImageIcon className={cls} />
    case 'text':
      return <Type className={cls} />
    case 'shape':
      return <Square className={cls} />
    case 'markdown':
      return <FileText className={cls} />
    case 'palette':
      return <Droplet className={cls} />
    default:
      return <Square className={cls} />
  }
}

export function FrameInspector({ element }: { element: FrameElement }) {
  const elements = useEditorStore((s) => s.elements)
  const activeCanvas = useEditorStore((s) => s.activeCanvas)
  const setElements = useEditorStore((s) => s.setElements)
  const updateElementLocal = useEditorStore((s) => s.updateElementLocal)
  const getMarkdownContent = useEditorStore((s) => s.getMarkdownContent)
  const { debouncedSave } = useAutosave()
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [exporting, setExporting] = useState(false)

  const commit = (next: CanvasElement[]) => {
    setElements(next)
    if (activeCanvas) {
      useHistoryStore.getState().pushHistory(activeCanvas.id, next)
      debouncedSave(activeCanvas, next)
    }
  }

  const applyLayout = (next: CanvasElement[]) => {
    commit(applyFrameLayout(element.id, next))
  }

  const updateFrame = (updates: Partial<FrameElement>) => {
    const next = elements.map((el) =>
      el.id === element.id ? ({ ...el, ...updates } as CanvasElement) : el,
    )
    applyLayout(next)
  }

  const children = element.childIds
    .map((id) => elements.find((el) => el.id === id))
    .filter((el): el is CanvasElement => el != null)

  const handleReorder = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0) return
    const ids = [...element.childIds]
    const [moved] = ids.splice(from, 1)
    if (!moved) return
    ids.splice(to, 0, moved)
    commit(reorderFrameChildren(elements, element.id, ids))
  }

  const handleRemoveChild = (childId: string) => {
    commit(removeChildFromFrame(elements, element.id, childId))
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const markdownByContentId = new Map<string, string>()
      for (const child of children) {
        if (child.type === 'markdown') {
          markdownByContentId.set(child.contentId, getMarkdownContent(child.contentId) ?? '')
        }
      }
      const blob = await exportFrameToPng(element, elements, markdownByContentId)
      downloadBlob(blob, 'frame.png')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="p-5">
      <InspectorHeader icon={Frame} label="Frame" />

      <div className="space-y-4">
        <div>
          <SectionLabel>Children ({children.length})</SectionLabel>
          {children.length === 0 ? (
            <p className="text-sm text-text-secondary">Drag elements onto the frame to add them.</p>
          ) : (
            <ul className="space-y-1">
              {children.map((child, index) => (
                <li
                  key={child.id}
                  draggable
                  onDragStart={() => setDragIndex(index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragIndex != null) handleReorder(dragIndex, index)
                    setDragIndex(null)
                  }}
                  onDragEnd={() => setDragIndex(null)}
                  className="flex items-center gap-2 rounded-lg border border-panel-border bg-gray-50 px-2 py-1.5 text-sm"
                >
                  <GripVertical className="h-3.5 w-3.5 shrink-0 cursor-grab text-text-secondary" />
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-white">
                    {index + 1}
                  </span>
                  <ChildIcon type={child.type} />
                  <span className="min-w-0 flex-1 truncate text-text-primary">{childLabel(child)}</span>
                  <button
                    type="button"
                    title="Remove from frame"
                    onClick={() => handleRemoveChild(child.id)}
                    className="shrink-0 rounded p-0.5 text-text-secondary hover:bg-gray-200 hover:text-text-primary"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {children.length >= FRAME_MAX_CHILDREN && (
            <p className="mt-1 text-xs text-amber-600">Maximum {FRAME_MAX_CHILDREN} children per frame.</p>
          )}
        </div>

        <div>
          <SectionLabel>Grid</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-text-secondary">
              Columns
              <input
                type="number"
                min={0}
                max={12}
                value={element.columns}
                onChange={(e) => updateFrame({ columns: Math.max(0, Number(e.target.value) || 0) })}
                className="mt-1 w-full rounded-lg border border-panel-border px-2 py-1.5 text-sm"
                placeholder="Auto"
              />
            </label>
            <label className="text-xs text-text-secondary">
              Gap
              <input
                type="number"
                min={0}
                max={64}
                value={element.gap}
                onChange={(e) => updateFrame({ gap: Math.max(0, Number(e.target.value) || 0) })}
                className="mt-1 w-full rounded-lg border border-panel-border px-2 py-1.5 text-sm"
              />
            </label>
            <label className="text-xs text-text-secondary">
              Padding
              <input
                type="number"
                min={0}
                max={96}
                value={element.padding}
                onChange={(e) => updateFrame({ padding: Math.max(0, Number(e.target.value) || 0) })}
                className="mt-1 w-full rounded-lg border border-panel-border px-2 py-1.5 text-sm"
              />
            </label>
            <label className="text-xs text-text-secondary">
              Corner radius
              <input
                type="number"
                min={0}
                max={48}
                value={element.radius}
                onChange={(e) => updateFrame({ radius: Math.max(0, Number(e.target.value) || 0) })}
                className="mt-1 w-full rounded-lg border border-panel-border px-2 py-1.5 text-sm"
              />
            </label>
          </div>
        </div>

        <div>
          <SectionLabel>Background</SectionLabel>
          <input
            type="color"
            value={element.backgroundColor}
            onChange={(e) => updateFrame({ backgroundColor: e.target.value })}
            className="h-9 w-full cursor-pointer rounded-lg border border-panel-border"
          />
        </div>

        <button
          type="button"
          disabled={exporting}
          onClick={() => void handleExport()}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60"
        >
          <Download className="h-4 w-4" />
          {exporting ? 'Exporting…' : 'Export as PNG'}
        </button>
      </div>

      <ElementActions
        locked={element.locked}
        onDuplicate={async () => {
          if (!activeCanvas) return
          const copies = await duplicateElementWithDependents(element)
          const newElements = [...elements, ...copies]
          setElements(newElements)
          useHistoryStore.getState().pushHistory(activeCanvas.id, newElements)
          debouncedSave(activeCanvas, newElements)
        }}
        onLock={() => updateElementLocal(element.id, { locked: !element.locked })}
        onDelete={async () => {
          if (!activeCanvas) return
          await deleteElement(element.id)
          const newElements = elements.filter((el) => el.id !== element.id)
          setElements(newElements)
          useHistoryStore.getState().pushHistory(activeCanvas.id, newElements)
          debouncedSave(activeCanvas, newElements)
        }}
      />
    </div>
  )
}
