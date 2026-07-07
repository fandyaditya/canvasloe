import { PanelLeft, PanelRight } from 'lucide-react'
import { useEditorStore } from './state/editorStore'

export function SidebarRail({ side }: { side: 'left' | 'right' }) {
  const setLeftSidebarOpen = useEditorStore((s) => s.setLeftSidebarOpen)
  const setRightSidebarOpen = useEditorStore((s) => s.setRightSidebarOpen)

  const isLeft = side === 'left'
  const Icon = isLeft ? PanelLeft : PanelRight
  const label = isLeft ? 'Show projects' : 'Show inspector'

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={() => (isLeft ? setLeftSidebarOpen(true) : setRightSidebarOpen(true))}
      className={`flex h-full w-10 shrink-0 flex-col items-center bg-white pt-4 text-text-secondary transition-colors hover:bg-gray-50 hover:text-primary ${
        isLeft ? 'border-r border-panel-border' : 'border-l border-panel-border'
      }`}
    >
      <Icon className="h-4 w-4" />
    </button>
  )
}
