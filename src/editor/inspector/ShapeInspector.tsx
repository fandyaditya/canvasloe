import { Square } from 'lucide-react'
import { InspectorHeader, SectionLabel, ColorField, OpacitySlider, ElementActions } from './shared'
import type { ShapeElement } from '../../db/schema'
import { useEditorStore } from '../state/editorStore'
import { useAutosave } from '../hooks/useAutosave'
import { useHistoryStore } from '../state/historyStore'
import { duplicateElement, deleteElement, removeElementsFromCanvas } from '../../db/elementRepo'

export function ShapeInspector({ element }: { element: ShapeElement }) {
  const updateElementLocal = useEditorStore((s) => s.updateElementLocal)
  const elements = useEditorStore((s) => s.elements)
  const activeCanvas = useEditorStore((s) => s.activeCanvas)
  const setElements = useEditorStore((s) => s.setElements)
  const { debouncedSave } = useAutosave()

  const update = (updates: Partial<ShapeElement>) => {
    updateElementLocal(element.id, updates)
    const newElements = useEditorStore.getState().elements
    if (activeCanvas) {
      useHistoryStore.getState().pushHistory(activeCanvas.id, newElements)
      debouncedSave(activeCanvas, newElements)
    }
  }

  return (
    <div className="p-5">
      <InspectorHeader icon={Square} label="Shape" />

      <div className="space-y-4">
        <div>
          <SectionLabel>Fill</SectionLabel>
          <ColorField
            color={element.fill}
            opacity={Math.round(element.fillOpacity * 100)}
            onColorChange={(fill) => update({ fill })}
            onOpacityChange={(v) => update({ fillOpacity: v / 100 })}
          />
        </div>

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
            {[0, 1, 2, 3, 4, 6, 8].map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </div>

        {element.shape === 'rect' && (
          <div>
            <SectionLabel>Corner radius</SectionLabel>
            <input
              type="number"
              value={element.radius ?? 0}
              onChange={(e) => update({ radius: Number(e.target.value) })}
              className="h-9 w-full rounded-lg border border-panel-border px-3 text-sm"
            />
          </div>
        )}

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
          const newElements = removeElementsFromCanvas(elements, [element.id])
          setElements(newElements)
          useEditorStore.getState().clearSelection()
          useHistoryStore.getState().pushHistory(activeCanvas.id, newElements)
          debouncedSave(activeCanvas, newElements)
        }}
      />
    </div>
  )
}
