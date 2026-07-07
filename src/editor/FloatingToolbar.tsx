import { useRef, useState } from 'react'
import {
  ArrowUpRight,
  ChevronRight,
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
import type { ShapeTool, Tool } from '../db/schema'
import { useImageImport } from './hooks/useImageImport'

const SHAPE_TOOLS: { id: ShapeTool; icon: typeof Square; label: string }[] = [
  { id: 'rect', icon: Square, label: 'Rectangle' },
  { id: 'circle', icon: Circle, label: 'Circle' },
  { id: 'arrow', icon: ArrowUpRight, label: 'Arrow' },
]

const TOOLS: { id: Tool; icon: typeof MousePointer2; label: string }[] = [
  { id: 'select', icon: MousePointer2, label: 'Select' },
  { id: 'hand', icon: Hand, label: 'Hand' },
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'markdown', icon: FileText, label: 'Markdown' },
  { id: 'frame', icon: Frame, label: 'Frame' },
  { id: 'color', icon: Droplet, label: 'Colour palette' },
]

function ShapeToolGroup() {
  const currentTool = useEditorStore((s) => s.currentTool)
  const preferredShapeTool = useEditorStore((s) => s.preferredShapeTool)
  const setCurrentTool = useEditorStore((s) => s.setCurrentTool)
  const [showHoverCue, setShowHoverCue] = useState(
    () => localStorage.getItem('shapeToolHoverCueSeen') !== '1',
  )

  const isShapeActive =
    currentTool === 'rect' || currentTool === 'circle' || currentTool === 'arrow'
  const PreferredIcon =
    SHAPE_TOOLS.find((tool) => tool.id === preferredShapeTool)?.icon ?? Square

  const dismissHoverCue = () => {
    if (!showHoverCue) return
    localStorage.setItem('shapeToolHoverCueSeen', '1')
    setShowHoverCue(false)
  }

  return (
    <div className="group relative" onMouseEnter={dismissHoverCue}>
      <button
        type="button"
        title={`${SHAPE_TOOLS.find((tool) => tool.id === preferredShapeTool)?.label ?? 'Shape'} — hover for more`}
        onClick={() => setCurrentTool(preferredShapeTool)}
        className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
          isShapeActive ? 'bg-primary text-white' : 'text-text-secondary hover:bg-gray-100'
        }`}
      >
        <PreferredIcon className="h-4 w-4" />
        <span
          className="absolute -right-0.5 bottom-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-panel-border bg-white shadow-sm"
          aria-hidden
        >
          <ChevronRight
            className={`h-2.5 w-2.5 ${isShapeActive ? 'text-primary' : 'text-text-secondary'}`}
          />
        </span>
      </button>

      {showHoverCue && (
        <div className="pointer-events-none absolute left-full top-1/2 z-10 ml-2 -translate-y-1/2">
          <div className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-white/95 px-2.5 py-1.5 text-xs text-text-secondary shadow-md backdrop-blur-sm">
            <ChevronRight className="h-3 w-3 text-primary" />
            <span>Hover for more shapes</span>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute left-full top-1/2 z-20 -translate-y-1/2 pl-1 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
        <div className="flex flex-col gap-1 rounded-full border border-panel-border bg-white p-1 shadow-md">
          {SHAPE_TOOLS.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              title={label}
              onClick={() => setCurrentTool(id)}
              className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                currentTool === id
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:bg-gray-100'
              }`}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

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
        {TOOLS.slice(0, 2).map(({ id, icon: Icon, label }) => (
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

        <ShapeToolGroup />

        {TOOLS.slice(2).map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            type="button"
            title={label}
            onClick={() => setCurrentTool(id)}
            className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
              currentTool === id ? 'bg-primary text-white' : 'text-text-secondary hover:bg-gray-100'
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
