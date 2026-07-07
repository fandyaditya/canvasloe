import { Layout } from 'lucide-react'
import { SectionLabel } from './shared'
import { useEditorStore } from '../state/editorStore'
import { deleteCanvas, updateCanvas } from '../../db/canvasRepo'

export function EmptyInspector() {
  const activeCanvas = useEditorStore((s) => s.activeCanvas)
  const setElements = useEditorStore((s) => s.setElements)

  if (!activeCanvas) {
    return (
      <div className="p-5 text-sm text-text-secondary">Select a canvas to edit settings.</div>
    )
  }

  const update = (updates: Parameters<typeof updateCanvas>[1]) => {
    void updateCanvas(activeCanvas.id, updates).then(() => {
      useEditorStore.getState().setActiveCanvas({ ...activeCanvas, ...updates })
    })
  }

  return (
    <div className="p-5">
      <div className="mb-5 flex items-center gap-2 border-b border-panel-border pb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Layout className="h-4 w-4 text-primary" />
        </div>
        <span className="text-base font-semibold">Canvas</span>
      </div>

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
            if (!confirm('Delete this canvas?')) return
            await deleteCanvas(activeCanvas.id)
            setElements([])
            useEditorStore.getState().setActiveCanvas(null)
          }}
          className="mt-4 w-full rounded-lg border border-red-200 py-2 text-sm text-red-500 hover:bg-red-50"
        >
          Delete canvas
        </button>
      </div>
    </div>
  )
}
