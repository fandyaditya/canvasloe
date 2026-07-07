import { create } from 'zustand'

export type DialogMode = 'confirm' | 'prompt'

type DialogStore = {
  open: boolean
  mode: DialogMode
  title: string
  message: string
  defaultValue: string
  confirmLabel: string
  resolveConfirm: ((value: boolean) => void) | null
  resolvePrompt: ((value: string | null) => void) | null
  requestConfirm: (message: string, title?: string) => Promise<boolean>
  requestPrompt: (options: {
    title: string
    message?: string
    defaultValue?: string
    confirmLabel?: string
  }) => Promise<string | null>
  answerConfirm: (confirmed: boolean) => void
  answerPrompt: (value: string | null) => void
  reset: () => void
}

export const useDialogStore = create<DialogStore>((set, get) => ({
  open: false,
  mode: 'confirm',
  title: 'Confirm delete',
  message: '',
  defaultValue: '',
  confirmLabel: 'Delete',
  resolveConfirm: null,
  resolvePrompt: null,
  requestConfirm: (message, title = 'Confirm delete') =>
    new Promise((resolve) => {
      set({
        open: true,
        mode: 'confirm',
        title,
        message,
        defaultValue: '',
        confirmLabel: 'Delete',
        resolveConfirm: resolve,
        resolvePrompt: null,
      })
    }),
  requestPrompt: ({ title, message = '', defaultValue = '', confirmLabel = 'Create' }) =>
    new Promise((resolve) => {
      set({
        open: true,
        mode: 'prompt',
        title,
        message,
        defaultValue,
        confirmLabel,
        resolvePrompt: resolve,
        resolveConfirm: null,
      })
    }),
  answerConfirm: (confirmed) => {
    const { resolveConfirm } = get()
    resolveConfirm?.(confirmed)
    get().reset()
  },
  answerPrompt: (value) => {
    const { resolvePrompt } = get()
    resolvePrompt?.(value)
    get().reset()
  },
  reset: () =>
    set({
      open: false,
      mode: 'confirm',
      title: 'Confirm delete',
      message: '',
      defaultValue: '',
      confirmLabel: 'Delete',
      resolveConfirm: null,
      resolvePrompt: null,
    }),
}))

// Back-compat alias for confirm flows
export const useConfirmStore = useDialogStore
