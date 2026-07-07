import { useEffect, type RefObject } from 'react'
import { useEditorStore } from '../state/editorStore'

function normalizeWheelDelta(e: WheelEvent, containerHeight: number) {
  let delta = e.deltaY
  if (e.deltaMode === WheelEvent.DOM_DELTA_LINE) delta *= 16
  if (e.deltaMode === WheelEvent.DOM_DELTA_PAGE) delta *= containerHeight
  return delta
}

export function useCanvasWheelZoom(containerRef: RefObject<HTMLDivElement | null>, enabled: boolean) {
  useEffect(() => {
    const container = containerRef.current
    if (!container || !enabled) return

    let lastPinchDistance: number | null = null

    const pointerInContainer = (clientX: number, clientY: number) => {
      const rect = container.getBoundingClientRect()
      return { x: clientX - rect.left, y: clientY - rect.top }
    }

    const onWheel = (e: WheelEvent) => {
      const isPinchGesture = e.ctrlKey || e.metaKey
      const isWheelZoom = !e.shiftKey && !e.altKey && Math.abs(e.deltaY) >= Math.abs(e.deltaX)

      if (!isPinchGesture && !isWheelZoom) return

      e.preventDefault()

      const delta = normalizeWheelDelta(e, container.clientHeight)
      const sensitivity = isPinchGesture ? 0.01 : 0.0015
      const factor = Math.exp(-delta * sensitivity)
      const pointer = pointerInContainer(e.clientX, e.clientY)
      useEditorStore.getState().zoomAtPoint(factor, pointer)
    }

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length < 2) lastPinchDistance = null
    }

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2) return

      e.preventDefault()

      const [a, b] = [e.touches[0], e.touches[1]]
      const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
      const center = pointerInContainer((a.clientX + b.clientX) / 2, (a.clientY + b.clientY) / 2)

      if (lastPinchDistance !== null && lastPinchDistance > 0) {
        useEditorStore.getState().zoomAtPoint(distance / lastPinchDistance, center)
      }

      lastPinchDistance = distance
    }

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) lastPinchDistance = null
    }

    container.addEventListener('wheel', onWheel, { passive: false })
    container.addEventListener('touchstart', onTouchStart, { passive: true })
    container.addEventListener('touchmove', onTouchMove, { passive: false })
    container.addEventListener('touchend', onTouchEnd, { passive: true })
    container.addEventListener('touchcancel', onTouchEnd, { passive: true })

    return () => {
      container.removeEventListener('wheel', onWheel)
      container.removeEventListener('touchstart', onTouchStart)
      container.removeEventListener('touchmove', onTouchMove)
      container.removeEventListener('touchend', onTouchEnd)
      container.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [containerRef, enabled])
}
