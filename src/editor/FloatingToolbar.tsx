import { useRef } from 'react'
import {
  ArrowUpRight,
  Circle,
  Droplet,
  FileText,
  Frame,
  Hand,
  ImagePlus,
  MousePointer2,
  Square,
  Type,
} from 'lucide-react'
import { useEditorStore } from './state/editorStore'
import type { Tool } from '../db/schema'
import { useImageImport } from './hooks/useImageImport'

const TOOLS: { id: Tool; icon: typeof MousePointer2; label: string }[] = [
  { id: 'select', icon: MousePointer2, label: 'Select' },
  { id: 'hand', icon: Hand, label: 'Hand' },
  { id: 'rect', icon: Square, label: 'Rectangle' },
  { id: 'circle', icon: Circle, label: 'Circle' },
  { id: 'arrow', icon: ArrowUpRight, label: 'Arrow' },
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'markdown', icon: FileText, label: 'Markdown' },
  { id: 'frame', icon: Frame, label: 'Frame' },
  { id: 'color', icon: Droplet, label: 'Colour palette' },
]

export function FloatingToolbar() {
  const currentTool = useEditorStore((s) => s.currentTool)
  const isShiftHandHold = useEditorStore((s) => s.isShiftHandHold)
  const isScrollPanHold = useEditorStore((s) => s.isScrollPanHold)
  const activeCanvas = useEditorStore((s) => s.activeCanvas)
  const setCurrentTool = useEditorStore((s) => s.setCurrentTool)
  const fileRef = useRef<HTMLInputElement>(null)
  const { addImage } = useImageImport()

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      await addImage(file)
    } catch (err) {
      console.error('Failed to upload image:', err)
      useEditorStore.getState().setSaveStatus('error')
    }
  }

  return (
    <div className="absolute left-4 top-1/2 z-10 -translate-y-1/2">
      <div className="flex flex-col gap-1 rounded-full border border-panel-border bg-white p-1.5 shadow-md">
        {TOOLS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            type="button"
            title={label}
            onClick={() => setCurrentTool(id)}
            className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
              currentTool === id || (id === 'hand' && (isShiftHandHold || isScrollPanHold))
                ? 'bg-primary text-white'
                : 'text-text-secondary hover:bg-gray-100'
            }`}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
        <label
          title={activeCanvas ? 'Upload image' : 'Select a canvas to upload an image'}
          className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition-colors ${
            activeCanvas ? 'text-text-secondary hover:bg-gray-100' : 'cursor-not-allowed text-text-secondary opacity-40'
          }`}
        >
          <ImagePlus className="h-4 w-4" />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={!activeCanvas}
            onChange={(e) => void handleUpload(e)}
          />
        </label>
      </div>
    </div>
  )
}
