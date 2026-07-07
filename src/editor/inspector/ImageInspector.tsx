import { ImageIcon, Upload } from 'lucide-react'
import { InspectorHeader, SectionLabel, OpacitySlider, ElementActions } from './shared'
import type { ImageElement } from '../../db/schema'
import { useEditorStore } from '../state/editorStore'
import { useAutosave } from '../hooks/useAutosave'
import { useHistoryStore } from '../state/historyStore'
import { duplicateElement, deleteElement, removeElementsFromCanvas } from '../../db/elementRepo'
import { readMediaBlob, updateImageMedia } from '../../db/assetRepo'
import { getImageDimensions } from '../../utils/image'
import { useEffect, useState } from 'react'
import { getObjectUrl } from '../../utils/objectUrlCache'

export function ImageInspector({ element }: { element: ImageElement }) {
  const updateElementLocal = useEditorStore((s) => s.updateElementLocal)
  const elements = useEditorStore((s) => s.elements)
  const activeCanvas = useEditorStore((s) => s.activeCanvas)
  const setElements = useEditorStore((s) => s.setElements)
  const { debouncedSave } = useAutosave()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    void readMediaBlob(element.assetId)
      .then((blob) => setPreviewUrl(getObjectUrl(element.assetId, blob)))
      .catch(() => setPreviewUrl(null))
  }, [element.assetId])

  const update = (updates: Partial<ImageElement>) => {
    updateElementLocal(element.id, updates)
    const newElements = useEditorStore.getState().elements
    if (activeCanvas) {
      useHistoryStore.getState().pushHistory(activeCanvas.id, newElements)
      debouncedSave(activeCanvas, newElements)
    }
  }

  const handleReplace = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      const blob = file.slice(0, file.size, file.type)
      const dims = await getImageDimensions(blob)
      await updateImageMedia(element.assetId, blob, dims)
      setPreviewUrl(getObjectUrl(element.assetId, blob))
    }
    input.click()
  }

  return (
    <div className="p-5">
      <InspectorHeader icon={ImageIcon} label="Image" />

      <div className="space-y-4">
        <div>
          <SectionLabel>Image preview</SectionLabel>
          <div className="overflow-hidden rounded-lg border border-panel-border bg-gray-50">
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="h-32 w-full object-cover" />
            ) : (
              <div className="flex h-32 items-center justify-center text-sm text-text-secondary">Loading...</div>
            )}
          </div>
          <button
            type="button"
            onClick={() => void handleReplace()}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-panel-border py-2 text-sm text-text-secondary hover:bg-gray-50"
          >
            <Upload className="h-4 w-4" />
            Replace
          </button>
        </div>

        <div>
          <SectionLabel>Caption</SectionLabel>
          <textarea
            value={element.caption ?? ''}
            onChange={(e) => update({ caption: e.target.value })}
            rows={3}
            placeholder="Add a caption below the image"
            className="w-full resize-none rounded-lg border border-panel-border px-3 py-2 text-sm text-text-primary outline-none focus:border-primary"
          />
        </div>

        <div>
          <SectionLabel>Fit</SectionLabel>
          <select
            value={element.fit}
            onChange={(e) => update({ fit: e.target.value as ImageElement['fit'] })}
            className="h-9 w-full rounded-lg border border-panel-border px-3 text-sm capitalize"
          >
            {(['contain', 'cover', 'stretch'] as const).map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>

        <div>
          <SectionLabel>Corner radius</SectionLabel>
          <input
            type="number"
            value={element.radius}
            onChange={(e) => update({ radius: Number(e.target.value) })}
            className="h-9 w-full rounded-lg border border-panel-border px-3 text-sm"
          />
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
