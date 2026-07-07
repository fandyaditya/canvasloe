import { useState } from 'react'
import { FileText } from 'lucide-react'
import { InspectorHeader, SectionLabel, ColorField, OpacitySlider, ElementActions } from './shared'
import type { MarkdownElement } from '../../db/schema'
import { MARKDOWN_CARD_PADDING, MARKDOWN_CARD_RADIUS } from '../../db/schema'
import { useEditorStore } from '../state/editorStore'
import { useAutosave } from '../hooks/useAutosave'
import { useHistoryStore } from '../state/historyStore'
import { duplicateElement, deleteElement, removeElementsFromCanvas } from '../../db/elementRepo'
import { MarkdownEditor } from '../components/MarkdownEditor'
import { MarkdownPreview } from '../components/MarkdownPreview'
import { useMarkdownContent } from '../hooks/useMarkdownContent'

const FONTS = ['Inter', 'Georgia', 'Arial', 'Helvetica', 'Playfair Display']

type Tab = 'edit' | 'preview'

function MarkdownStyleSettings({
  element,
  onUpdate,
}: {
  element: MarkdownElement
  onUpdate: (updates: Partial<MarkdownElement>) => void
}) {
  return (
    <div className="space-y-4 border-t border-panel-border pt-4">
      <div>
        <SectionLabel>Font</SectionLabel>
        <select
          value={element.fontFamily}
          onChange={(e) => onUpdate({ fontFamily: e.target.value })}
          className="h-9 w-full rounded-lg border border-panel-border px-3 text-sm"
        >
          {FONTS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>
      <div>
        <SectionLabel>Text color</SectionLabel>
        <ColorField color={element.textColor} onColorChange={(textColor) => onUpdate({ textColor })} />
      </div>
      <div>
        <SectionLabel>Background</SectionLabel>
        <ColorField
          color={element.backgroundColor}
          onColorChange={(backgroundColor) => onUpdate({ backgroundColor })}
        />
      </div>
      <div>
        <SectionLabel>Opacity</SectionLabel>
        <OpacitySlider value={element.opacity} onChange={(opacity) => onUpdate({ opacity })} />
      </div>
    </div>
  )
}

export function MarkdownInspector({ element }: { element: MarkdownElement }) {
  const [tab, setTab] = useState<Tab>('edit')
  const updateElementLocal = useEditorStore((s) => s.updateElementLocal)
  const elements = useEditorStore((s) => s.elements)
  const activeCanvas = useEditorStore((s) => s.activeCanvas)
  const setElements = useEditorStore((s) => s.setElements)
  const setOpenMarkdownId = useEditorStore((s) => s.setOpenMarkdownId)
  const { debouncedSave } = useAutosave()
  const [markdown, setMarkdown] = useMarkdownContent(element.contentId)

  const update = (updates: Partial<MarkdownElement>) => {
    updateElementLocal(element.id, updates)
    const newElements = useEditorStore.getState().elements
    if (activeCanvas) {
      useHistoryStore.getState().pushHistory(activeCanvas.id, newElements)
      debouncedSave(activeCanvas, newElements)
    }
  }

  const tabBtn = (id: Tab, label: string) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      className={`flex-1 border-b-2 py-2 text-sm font-medium transition-colors ${
        tab === id
          ? 'border-primary text-primary'
          : 'border-transparent text-text-secondary hover:text-text-primary'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="p-5">
      <InspectorHeader icon={FileText} label="Markdown" />

      <div className="mb-4 flex gap-1 border-b border-panel-border">
        {tabBtn('edit', 'Edit')}
        {tabBtn('preview', 'Preview')}
      </div>

      <div className="space-y-4">
        {tab === 'edit' ? (
          <MarkdownEditor value={markdown} onChange={setMarkdown} minLines={9} />
        ) : (
          <MarkdownPreview
            markdown={markdown}
            fontFamily={element.fontFamily}
            textColor={element.textColor}
            backgroundColor={element.backgroundColor}
            padding={MARKDOWN_CARD_PADDING}
            radius={MARKDOWN_CARD_RADIUS}
            className="max-h-48 border border-panel-border"
          />
        )}

        <button
          type="button"
          onClick={() => setOpenMarkdownId(element.id)}
          className="w-full rounded-lg border border-panel-border py-2 text-sm font-medium text-text-primary hover:bg-gray-50"
        >
          Open full view
        </button>

        <MarkdownStyleSettings element={element} onUpdate={update} />
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
