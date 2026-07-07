import { ZoomIn } from 'lucide-react'
import { useEditorStore } from '../state/editorStore'

export function CanvasGestureCue() {
  const isShiftKeyDown = useEditorStore((s) => s.isShiftKeyDown)

  if (!isShiftKeyDown) return null

  return (
    <div className="pointer-events-none absolute bottom-4 left-16 z-10">
      <div className="flex items-center gap-2 rounded-lg bg-white/95 px-3 py-2 text-sm text-text-primary shadow-md backdrop-blur-sm">
        <kbd className="flex h-6 min-w-6 items-center justify-center rounded bg-gray-100 px-1.5 text-xs font-semibold text-text-secondary">
          ⇧
        </kbd>
        <ZoomIn className="h-4 w-4 text-text-secondary" />
        <span>Scroll to zoom</span>
      </div>
    </div>
  )
}
