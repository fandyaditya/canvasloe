import { Copy, Lock, Trash2 } from 'lucide-react'

export function ElementActions({
  locked,
  onDuplicate,
  onLock,
  onDelete,
}: {
  locked?: boolean
  onDuplicate: () => void
  onLock: () => void
  onDelete: () => void
}) {
  return (
    <div className="mt-6 flex gap-2 border-t border-panel-border pt-4">
      <button
        type="button"
        onClick={onDuplicate}
        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-panel-border px-3 py-2 text-sm text-text-secondary hover:bg-gray-50"
      >
        <Copy className="h-4 w-4" />
        Duplicate
      </button>
      <button
        type="button"
        onClick={onLock}
        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-panel-border px-3 py-2 text-sm text-text-secondary hover:bg-gray-50"
      >
        <Lock className="h-4 w-4" />
        {locked ? 'Unlock' : 'Lock'}
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-500 hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" />
        Delete
      </button>
    </div>
  )
}
