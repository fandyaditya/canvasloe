import type { LucideIcon } from 'lucide-react'
import { PanelRight } from 'lucide-react'

export function InspectorHeader({
  icon: Icon,
  label,
  onClose,
}: {
  icon: LucideIcon
  label: string
  onClose?: () => void
}) {
  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-panel-border px-3 py-2">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <span className="truncate text-sm font-semibold text-text-primary">{label}</span>
      </div>
      {onClose && (
        <button
          type="button"
          title="Close inspector"
          aria-label="Close inspector sidebar"
          onClick={onClose}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-gray-100 hover:text-text-primary"
        >
          <PanelRight className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
