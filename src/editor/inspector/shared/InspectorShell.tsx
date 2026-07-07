import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { InspectorHeader } from './InspectorHeader'

export function InspectorShell({
  icon,
  label,
  onClose,
  children,
}: {
  icon: LucideIcon
  label: string
  onClose?: () => void
  children: ReactNode
}) {
  return (
    <>
      <InspectorHeader icon={icon} label={label} onClose={onClose} />
      <div className="p-4">{children}</div>
    </>
  )
}
