import { useEffect, useRef, type RefObject } from 'react'
import { useEditorStore } from '../state/editorStore'

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
}

function isShiftKey(e: KeyboardEvent) {
  return e.key === 'Shift' || e.code === 'ShiftLeft' || e.code === 'ShiftRight'
}

function isPointerOverContainer(container: HTMLElement, clientX: number, clientY: number) {
  const rect = container.getBoundingClientRect()
  return (
    clientX >= rect.left &&
    clientX <= rect.right &&
    clientY >= rect.top &&
    clientY <= rect.bottom
  )
}

export function useShiftHandHold(containerRef: RefObject<HTMLDivElement | null>) {
  const isShiftHandHold = useEditorStore((s) => s.isShiftHandHold)
  const lastPointer = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!isShiftKey(e) || e.repeat || isEditableTarget(e.target)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      lastPointer.current = null
      useEditorStore.getState().enterShiftHandHold()
    }

    const onKeyUp = (e: KeyboardEvent) => {
      if (!isShiftKey(e)) return
      lastPointer.current = null
      useEditorStore.getState().exitShiftHandHold()
    }

    const onBlur = () => {
      lastPointer.current = null
      useEditorStore.getState().exitShiftHandHold()
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [])

  useEffect(() => {
    if (!isShiftHandHold) {
      lastPointer.current = null
      return
    }

    const panByPointer = (clientX: number, clientY: number) => {
      const container = containerRef.current
      if (!container || !isPointerOverContainer(container, clientX, clientY)) {
        lastPointer.current = null
        return
      }

      if (!lastPointer.current) {
        lastPointer.current = { x: clientX, y: clientY }
        return
      }

      const dx = clientX - lastPointer.current.x
      const dy = clientY - lastPointer.current.y
      lastPointer.current = { x: clientX, y: clientY }

      const { pan, setPan } = useEditorStore.getState()
      setPan({ x: pan.x + dx, y: pan.y + dy })
    }

    const onPointerMove = (e: PointerEvent) => {
      panByPointer(e.clientX, e.clientY)
    }

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      lastPointer.current = null
      panByPointer(e.clientX, e.clientY)
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerdown', onPointerDown)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerdown', onPointerDown)
    }
  }, [containerRef, isShiftHandHold])
}
