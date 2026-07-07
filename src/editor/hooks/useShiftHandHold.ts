import { useEffect, useRef, type RefObject } from 'react'
import { useEditorStore } from '../state/editorStore'

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
