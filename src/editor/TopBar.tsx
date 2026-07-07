import { Check, Minus, Plus, Redo2, RotateCcw, Undo2 } from 'lucide-react'
import { updateCanvas } from '../db/canvasRepo'
import { useEditorStore } from './state/editorStore'
import { useHistoryStore } from './state/historyStore'
import { useAutosave } from './hooks/useAutosave'
import { InlineEditable } from './components/InlineEditable'

export function TopBar() {
  const activeCanvas = useEditorStore((s) => s.activeCanvas)
  const setActiveCanvas = useEditorStore((s) => s.setActiveCanvas)
  const zoom = useEditorStore((s) => s.zoom)
  const setZoom = useEditorStore((s) => s.setZoom)
  const saveStatus = useEditorStore((s) => s.saveStatus)
  const setElements = useEditorStore((s) => s.setElements)
  const { debouncedSave } = useAutosave()

  const canvasId = activeCanvas?.id ?? ''
  const canUndo = useHistoryStore((s) => s.canUndo(canvasId))
  const canRedo = useHistoryStore((s) => s.canRedo(canvasId))

  const handleUndo = () => {
    if (!activeCanvas) return
    const restored = useHistoryStore.getState().undo(activeCanvas.id)
    if (restored) {
      setElements(restored)
      debouncedSave(activeCanvas, restored)
    }
  }

  const handleRedo = () => {
    if (!activeCanvas) return
    const restored = useHistoryStore.getState().redo(activeCanvas.id)
    if (restored) {
      setElements(restored)
      debouncedSave(activeCanvas, restored)
    }
  }

  const handleCanvasRename = (name: string) => {
    if (!activeCanvas) return
    void updateCanvas(activeCanvas.id, { name }).then(() => {
      setActiveCanvas({ ...activeCanvas, name })
    })
  }

  const zoomPercent = Math.round(zoom * 100)
  const showZoomReset = zoomPercent !== 100

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-panel-border bg-white px-4">
      <div className="flex items-center gap-3">
        <InlineEditable
          value={activeCanvas?.name ?? ''}
          onSave={handleCanvasRename}
          placeholder="No canvas"
          className="rounded-lg px-2 py-1.5 text-sm font-medium hover:bg-gray-50"
          inputClassName="rounded-lg border border-panel-border px-2 py-1.5 text-sm font-medium outline-none focus:border-primary"
        />

        <div className="ml-2 flex items-center gap-1">
          <button
            type="button"
            onClick={handleUndo}
            disabled={!canUndo}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-panel-border text-text-secondary hover:bg-gray-50 disabled:opacity-40"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={!canRedo}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-panel-border text-text-secondary hover:bg-gray-50 disabled:opacity-40"
          >
            <Redo2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 rounded-lg border border-panel-border px-1">
          <button
            type="button"
            onClick={() => setZoom(zoom / 1.1)}
            className="flex h-8 w-8 items-center justify-center text-text-secondary hover:bg-gray-50"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="min-w-[48px] text-center text-sm text-text-secondary">
            {zoomPercent}%
          </span>
          {showZoomReset && (
            <button
              type="button"
              title="Reset zoom to 100%"
              aria-label="Reset zoom to 100%"
              onClick={() => setZoom(1)}
              className="flex h-8 w-8 items-center justify-center text-text-secondary hover:bg-gray-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setZoom(zoom * 1.1)}
            className="flex h-8 w-8 items-center justify-center text-text-secondary hover:bg-gray-50"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-sm text-text-secondary">
          {saveStatus === 'saved' && <Check className="h-4 w-4 text-green-500" />}
          <span>
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'error' ? 'Save failed' : 'All changes saved'}
          </span>
        </div>
      </div>
    </header>
  )
}
