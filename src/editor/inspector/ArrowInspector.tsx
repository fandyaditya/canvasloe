import { ArrowUpRight } from 'lucide-react'
import { InspectorHeader, SectionLabel, ColorField, OpacitySlider, ElementActions } from './shared'
import type { ArrowElement } from '../../db/schema'
import { useEditorStore } from '../state/editorStore'
import { useAutosave } from '../hooks/useAutosave'
import { useHistoryStore } from '../state/historyStore'
import { duplicateElement, deleteElement } from '../../db/elementRepo'

export function ArrowInspector({ element }: { element: ArrowElement }) {
  const updateElementLocal = useEditorStore((s) => s.updateElementLocal)
  const elements = useEditorStore((s) => s.elements)
  const activeCanvas = useEditorStore((s) => s.activeCanvas)
  const setElements = useEditorStore((s) => s.setElements)
  const { debouncedSave } = useAutosave()

  const update = (updates: Partial<ArrowElement>) => {
    updateElementLocal(element.id, updates)
    const newElements = useEditorStore.getState().elements
    if (activeCanvas) {
      useHistoryStore.getState().pushHistory(activeCanvas.id, newElements)
      debouncedSave(activeCanvas, newElements)
    }
  }

  const Toggle = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between">
      <span className="text-sm text-text-secondary">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative h-6 w-11 rounded-full transition-colors ${value ? 'bg-primary' : 'bg-gray-200'}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`}
        />
      </button>
    </div>
  )

  return (
    <div className="p-5">
      <InspectorHeader icon={ArrowUpRight} label="Arrow" />

      <div className="space-y-4">
        <div>
          <SectionLabel>Stroke</SectionLabel>
          <ColorField
            color={element.stroke}
            opacity={Math.round(element.strokeOpacity * 100)}
            onColorChange={(stroke) => update({ stroke })}
            onOpacityChange={(v) => update({ strokeOpacity: v / 100 })}
          />
        </div>

        <div>
          <SectionLabel>Stroke width</SectionLabel>
          <select
            value={element.strokeWidth}
            onChange={(e) => update({ strokeWidth: Number(e.target.value) })}
            className="h-9 w-full rounded-lg border border-panel-border px-3 text-sm"
          >
            {[1, 2, 3, 4, 6, 8].map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </div>

        <div>
          <SectionLabel>Arrowheads</SectionLabel>
          <div className="space-y-2 rounded-lg border border-panel-border p-3">
            <Toggle label="Start" value={element.startHead} onChange={(startHead) => update({ startHead })} />
            <Toggle label="End" value={element.endHead} onChange={(endHead) => update({ endHead })} />
          </div>
        </div>

        <div>
          <SectionLabel>Line style</SectionLabel>
          <select
            value={element.dashed ? 'dashed' : 'solid'}
            onChange={(e) => update({ dashed: e.target.value === 'dashed' })}
            className="h-9 w-full rounded-lg border border-panel-border px-3 text-sm capitalize"
          >
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
          </select>
        </div>

        <div>
          <SectionLabel>Opacity</SectionLabel>
          <OpacitySlider value={element.opacity} onChange={(opacity) => update({ opacity })} />
        </div>
      </div>

      <ElementActions
        locked={element.locked}
        onDuplicate={async () => {
          if (!activeCanvas) return
          const copy = await duplicateElement(element)
          const newElements = [...elements, copy]
          setElements(newElements)
          useHistoryStore.getState().pushHistory(activeCanvas.id, newElements)
          debouncedSave(activeCanvas, newElements)
        }}
        onLock={() => update({ locked: !element.locked })}
        onDelete={async () => {
          if (!activeCanvas) return
          await deleteElement(element.id)
          const newElements = elements.filter((el) => el.id !== element.id)
          setElements(newElements)
          useEditorStore.getState().clearSelection()
          useHistoryStore.getState().pushHistory(activeCanvas.id, newElements)
          debouncedSave(activeCanvas, newElements)
        }}
      />
    </div>
  )
}
