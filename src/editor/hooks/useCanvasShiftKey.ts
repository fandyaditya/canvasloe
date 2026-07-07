import { useEffect } from 'react'
import { useEditorStore } from '../state/editorStore'

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
}

function isShiftKey(e: KeyboardEvent) {
  return e.key === 'Shift' || e.code === 'ShiftLeft' || e.code === 'ShiftRight'
}

function clearShiftState() {
  const store = useEditorStore.getState()
  store.setShiftKeyDown(false)
  store.exitShiftHandHold()
}

export function useCanvasShiftKey(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (!isShiftKey(e) || e.repeat) return
      useEditorStore.getState().setShiftKeyDown(true)
      if (isEditableTarget(e.target)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      useEditorStore.getState().enterShiftHandHold()
    }

    const onKeyUp = (e: KeyboardEvent) => {
      if (!e.getModifierState('Shift')) {
        clearShiftState()
      }
    }

    const onBlur = () => {
      clearShiftState()
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
      clearShiftState()
    }
  }, [enabled])
}
