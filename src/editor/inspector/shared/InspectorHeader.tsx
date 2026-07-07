import type { LucideIcon } from 'lucide-react'

export function InspectorHeader({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="mb-5 flex items-center gap-2 border-b border-panel-border pb-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <span className="text-base font-semibold text-text-primary">{label}</span>
    </div>
  )
}
