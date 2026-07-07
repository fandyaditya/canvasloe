import { Layout } from 'lucide-react'
import { InspectorShell, SectionLabel } from './shared'
import { useEditorStore } from '../state/editorStore'
import { deleteCanvas, updateCanvas } from '../../db/canvasRepo'
import { confirmDelete } from '../../utils/confirmDelete'

export function EmptyInspector({ onClose }: { onClose?: () => void }) {
  const activeCanvas = useEditorStore((s) => s.activeCanvas)
  const setElements = useEditorStore((s) => s.setElements)

  if (!activeCanvas) {
    return (
      <InspectorShell icon={Layout} label="Inspector" onClose={onClose}>
        <p className="text-sm text-text-secondary">Select a canvas to edit settings.</p>
      </InspectorShell>
    )
  }

  const update = (updates: Parameters<typeof updateCanvas>[1]) => {
    void updateCanvas(activeCanvas.id, updates).then(() => {
      useEditorStore.getState().setActiveCanvas({ ...activeCanvas, ...updates })
    })
  }

  return (
    <InspectorShell icon={Layout} label="Canvas" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <SectionLabel>Canvas name</SectionLabel>
          <input
            type="text"
            value={activeCanvas.name}
            onChange={(e) => update({ name: e.target.value })}
            className="h-9 w-full rounded-lg border border-panel-border px-3 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <SectionLabel>Width</SectionLabel>
            <input
              type="number"
              value={activeCanvas.width}
              onChange={(e) => update({ width: Number(e.target.value) })}
              className="h-9 w-full rounded-lg border border-panel-border px-3 text-sm"
            />
          </div>
          <div>
            <SectionLabel>Height</SectionLabel>
            <input
              type="number"
              value={activeCanvas.height}
              onChange={(e) => update({ height: Number(e.target.value) })}
              className="h-9 w-full rounded-lg border border-panel-border px-3 text-sm"
            />
          </div>
        </div>

        <div>
          <SectionLabel>Background color</SectionLabel>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={activeCanvas.background}
              onChange={(e) => update({ background: e.target.value })}
              className="h-9 w-9 cursor-pointer rounded-lg border border-panel-border"
            />
            <input
              type="text"
              value={activeCanvas.background}
              onChange={(e) => update({ background: e.target.value })}
              className="h-9 flex-1 rounded-lg border border-panel-border px-3 text-sm"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <SectionLabel>Dot grid</SectionLabel>
          <button
            type="button"
            onClick={() => update({ gridEnabled: !activeCanvas.gridEnabled })}
            className={`relative h-6 w-11 rounded-full transition-colors ${activeCanvas.gridEnabled ? 'bg-primary' : 'bg-gray-200'}`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${activeCanvas.gridEnabled ? 'translate-x-5' : 'translate-x-0.5'}`}
            />
          </button>
        </div>

        <button
          type="button"
          onClick={async () => {
            if (
              !(await confirmDelete(
                `Are you sure you want to delete "${activeCanvas.name}"?\n\nAll elements and files on this canvas will be permanently removed.`,
              ))
            ) {
              return
            }
            await deleteCanvas(activeCanvas.id)
            setElements([])
            useEditorStore.getState().clearMarkdownCache()
            useEditorStore.getState().setActiveCanvas(null)
            useEditorStore.getState().setActiveCanvasId(null)
          }}
          className="mt-4 w-full rounded-lg border border-red-200 py-2 text-sm text-red-500 hover:bg-red-50"
        >
          Delete canvas
        </button>
      </div>
    </InspectorShell>
  )
}
