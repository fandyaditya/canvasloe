import { useEffect, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useDialogStore } from '../state/confirmStore'

export function ConfirmDialog() {
  const open = useDialogStore((s) => s.open)
  const mode = useDialogStore((s) => s.mode)
  const title = useDialogStore((s) => s.title)
  const message = useDialogStore((s) => s.message)
  const defaultValue = useDialogStore((s) => s.defaultValue)
  const confirmLabel = useDialogStore((s) => s.confirmLabel)
  const answerConfirm = useDialogStore((s) => s.answerConfirm)
  const answerPrompt = useDialogStore((s) => s.answerPrompt)
  const [inputValue, setInputValue] = useState(defaultValue)

  useEffect(() => {
    if (open && mode === 'prompt') {
      setInputValue(defaultValue)
    }
  }, [open, mode, defaultValue])

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      if (mode === 'confirm') answerConfirm(false)
      else answerPrompt(null)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[60] w-[min(400px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-panel-border bg-white p-5 shadow-xl outline-none">
          <Dialog.Title className="text-base font-semibold text-text-primary">{title}</Dialog.Title>
          {message ? (
            <Dialog.Description className="mt-2 whitespace-pre-line text-sm text-text-secondary">
              {message}
            </Dialog.Description>
          ) : null}

          {mode === 'prompt' ? (
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') answerPrompt(inputValue.trim() || null)
              }}
              autoFocus
              className="mt-4 h-10 w-full rounded-lg border border-panel-border px-3 text-sm outline-none focus:border-primary"
            />
          ) : null}

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => (mode === 'confirm' ? answerConfirm(false) : answerPrompt(null))}
              className="rounded-lg border border-panel-border px-4 py-2 text-sm text-text-secondary hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() =>
                mode === 'confirm'
                  ? answerConfirm(true)
                  : answerPrompt(inputValue.trim() || null)
              }
              className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
                mode === 'confirm' ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-primary/90'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
