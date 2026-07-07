import { Droplet } from 'lucide-react'
import { InspectorHeader, SectionLabel, ColorField, OpacitySlider, ElementActions } from './shared'
import type { PaletteElement } from '../../db/schema'
import {
  PALETTE_SLOT_LABELS,
  getPaletteDimensions,
  paletteColorsForCount,
} from '../../db/schema'
import { useEditorStore } from '../state/editorStore'
import { useAutosave } from '../hooks/useAutosave'
import { useHistoryStore } from '../state/historyStore'
import { duplicateElement, deleteElement, removeElementsFromCanvas } from '../../db/elementRepo'

export function PaletteInspector({ element }: { element: PaletteElement }) {
  const updateElementLocal = useEditorStore((s) => s.updateElementLocal)
  const elements = useEditorStore((s) => s.elements)
  const activeCanvas = useEditorStore((s) => s.activeCanvas)
  const setElements = useEditorStore((s) => s.setElements)
  const { debouncedSave } = useAutosave()

  const update = (updates: Partial<PaletteElement>) => {
    updateElementLocal(element.id, updates)
    const newElements = useEditorStore.getState().elements
    if (activeCanvas) {
      useHistoryStore.getState().pushHistory(activeCanvas.id, newElements)
      debouncedSave(activeCanvas, newElements)
    }
  }

  const setColorCount = (colorCount: number) => {
    const colors = paletteColorsForCount(element.colors, colorCount)
    const { width, height } = getPaletteDimensions(colorCount)
    update({ colorCount, colors, width, height })
  }

  const setColorAt = (index: number, color: string) => {
    const colors = [...element.colors]
    colors[index] = color
    update({ colors })
  }

  return (
    <div className="p-5">
      <InspectorHeader icon={Droplet} label="Colour palette" />

      <div className="space-y-4">
        <div>
          <SectionLabel>Colours</SectionLabel>
          <select
            value={element.colorCount}
            onChange={(e) => setColorCount(Number(e.target.value))}
            className="h-9 w-full rounded-lg border border-panel-border px-3 text-sm"
          >
            {[3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n} colours
              </option>
            ))}
          </select>
        </div>

        {Array.from({ length: element.colorCount }, (_, index) => (
          <div key={index}>
            <SectionLabel>{PALETTE_SLOT_LABELS[index]}</SectionLabel>
            <ColorField
              color={element.colors[index] ?? '#000000'}
              onColorChange={(color) => setColorAt(index, color)}
            />
          </div>
        ))}

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
