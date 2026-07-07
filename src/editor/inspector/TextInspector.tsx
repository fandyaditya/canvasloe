import { Type, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight } from 'lucide-react'
import { InspectorHeader, SectionLabel, ColorField, OpacitySlider, ElementActions } from './shared'
import type { TextElement } from '../../db/schema'
import { useEditorStore } from '../state/editorStore'
import { useAutosave } from '../hooks/useAutosave'
import { useHistoryStore } from '../state/historyStore'
import { duplicateElement, deleteElement, removeElementsFromCanvas } from '../../db/elementRepo'

const FONTS = ['Playfair Display', 'Inter', 'Georgia', 'Arial', 'Helvetica']
const WEIGHTS = ['regular', 'medium', 'semibold', 'bold'] as const
const SIZES = [12, 14, 16, 18, 24, 32, 48, 56, 64, 72]

export function TextInspector({ element }: { element: TextElement }) {
  const updateElementLocal = useEditorStore((s) => s.updateElementLocal)
  const elements = useEditorStore((s) => s.elements)
  const activeCanvas = useEditorStore((s) => s.activeCanvas)
  const setElements = useEditorStore((s) => s.setElements)
  const { debouncedSave } = useAutosave()

  const update = (updates: Partial<TextElement>) => {
    updateElementLocal(element.id, updates)
    const newElements = useEditorStore.getState().elements
    if (activeCanvas) {
      useHistoryStore.getState().pushHistory(activeCanvas.id, newElements)
      debouncedSave(activeCanvas, newElements)
    }
  }

  const alignBtn = (align: 'left' | 'center' | 'right', Icon: typeof AlignLeft) => (
    <button
      type="button"
      onClick={() => update({ textAlign: align })}
      className={`flex h-9 flex-1 items-center justify-center rounded-lg border ${element.textAlign === align ? 'border-primary bg-primary/10 text-primary' : 'border-panel-border text-text-secondary'}`}
    >
      <Icon className="h-4 w-4" />
    </button>
  )

  return (
    <div className="p-5">
      <InspectorHeader icon={Type} label="Text" />

      <div className="space-y-4">
        <div>
          <SectionLabel>Content</SectionLabel>
          <textarea
            value={element.text}
            onChange={(e) => update({ text: e.target.value })}
            rows={2}
            className="w-full resize-none rounded-lg border border-panel-border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <SectionLabel>Typography</SectionLabel>
          <div className="space-y-2">
            <select
              value={element.fontFamily}
              onChange={(e) => update({ fontFamily: e.target.value })}
              className="h-9 w-full rounded-lg border border-panel-border px-3 text-sm"
            >
              {FONTS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={element.fontSize}
                onChange={(e) => update({ fontSize: Number(e.target.value) })}
                className="h-9 rounded-lg border border-panel-border px-3 text-sm"
              >
                {SIZES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <select
                value={element.fontWeight}
                onChange={(e) => update({ fontWeight: e.target.value as TextElement['fontWeight'] })}
                className="h-9 rounded-lg border border-panel-border px-3 text-sm capitalize"
              >
                {WEIGHTS.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => update({ fontWeight: element.fontWeight === 'bold' ? 'regular' : 'bold' })}
                className={`flex h-9 w-9 items-center justify-center rounded-lg border ${element.fontWeight === 'bold' ? 'border-primary bg-primary/10 text-primary' : 'border-panel-border'}`}
              >
                <Bold className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => update({ italic: !element.italic })}
                className={`flex h-9 w-9 items-center justify-center rounded-lg border ${element.italic ? 'border-primary bg-primary/10 text-primary' : 'border-panel-border'}`}
              >
                <Italic className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => update({ underline: !element.underline })}
                className={`flex h-9 w-9 items-center justify-center rounded-lg border ${element.underline ? 'border-primary bg-primary/10 text-primary' : 'border-panel-border'}`}
              >
                <Underline className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div>
          <SectionLabel>Text align</SectionLabel>
          <div className="flex gap-2">
            {alignBtn('left', AlignLeft)}
            {alignBtn('center', AlignCenter)}
            {alignBtn('right', AlignRight)}
          </div>
        </div>

        <div>
          <SectionLabel>Text color</SectionLabel>
          <ColorField color={element.color} onColorChange={(color) => update({ color })} />
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
