import { useEffect, type RefObject } from 'react'
import { useEditorStore } from '../state/editorStore'

function normalizeWheelAxis(delta: number, deltaMode: number, pageSize: number) {
  if (deltaMode === WheelEvent.DOM_DELTA_LINE) return delta * 16
  if (deltaMode === WheelEvent.DOM_DELTA_PAGE) return delta * pageSize
  return delta
}

export function useCanvasWheelZoom(containerRef: RefObject<HTMLDivElement | null>, enabled: boolean) {
  useEffect(() => {
    const container = containerRef.current
    if (!container || !enabled) return

    let lastPinchDistance: number | null = null
    let scrollPanExitTimer: ReturnType<typeof setTimeout> | null = null

    const scheduleScrollPanHoldExit = () => {
      if (scrollPanExitTimer) clearTimeout(scrollPanExitTimer)
      scrollPanExitTimer = setTimeout(() => {
        useEditorStore.getState().exitScrollPanHold()
        scrollPanExitTimer = null
      }, 150)
    }

    const beginScrollPan = () => {
      useEditorStore.getState().enterScrollPanHold()
      scheduleScrollPanHoldExit()
    }

    const pointerInContainer = (clientX: number, clientY: number) => {
      const rect = container.getBoundingClientRect()
      return { x: clientX - rect.left, y: clientY - rect.top }
    }

    const onWheel = (e: WheelEvent) => {
      if (useEditorStore.getState().isEditingText) return

      const deltaX = normalizeWheelAxis(e.deltaX, e.deltaMode, container.clientWidth)
      const deltaY = normalizeWheelAxis(e.deltaY, e.deltaMode, container.clientHeight)
      const isPinchGesture = e.ctrlKey || e.metaKey
      const shiftHeld = e.shiftKey || useEditorStore.getState().isShiftKeyDown
      if (e.shiftKey) {
        useEditorStore.getState().setShiftKeyDown(true)
      }
      const isShiftZoom = shiftHeld && !e.altKey && !isPinchGesture

      e.preventDefault()

      const pointer = pointerInContainer(e.clientX, e.clientY)

      if (isPinchGesture || isShiftZoom) {
        const zoomDelta = Math.abs(deltaY) >= Math.abs(deltaX) ? deltaY : deltaX
        if (isShiftZoom && zoomDelta === 0) return
        const sensitivity = isPinchGesture ? 0.01 : 0.0015
        const factor = Math.exp(-zoomDelta * sensitivity)
        useEditorStore.getState().zoomAtPoint(factor, pointer)
        return
      }

      beginScrollPan()
      const { pan, setPan } = useEditorStore.getState()
      setPan({ x: pan.x - deltaX, y: pan.y - deltaY })
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
      if (scrollPanExitTimer) clearTimeout(scrollPanExitTimer)
      useEditorStore.getState().exitScrollPanHold()
      container.removeEventListener('wheel', onWheel)
      container.removeEventListener('touchstart', onTouchStart)
      container.removeEventListener('touchmove', onTouchMove)
      container.removeEventListener('touchend', onTouchEnd)
      container.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [containerRef, enabled])
}
