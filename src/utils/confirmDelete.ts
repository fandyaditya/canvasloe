import { useDialogStore } from '../editor/state/confirmStore'

const DEFAULT_MESSAGE = 'Are you sure you want to delete this?'

export async function confirmDelete(message = DEFAULT_MESSAGE): Promise<boolean> {
  return useDialogStore.getState().requestConfirm(message)
}

export async function promptInput(options: {
  title: string
  message?: string
  defaultValue?: string
  confirmLabel?: string
}): Promise<string | null> {
  return useDialogStore.getState().requestPrompt(options)
}
