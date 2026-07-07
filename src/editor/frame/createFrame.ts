import { createElement } from '../../db/elementRepo'
import type { Canvas, CanvasElement, FrameElement } from '../../db/schema'
import {
  FRAME_DEFAULT_BACKGROUND,
  FRAME_DEFAULT_CONNECTOR_COLOR,
  FRAME_DEFAULT_CONNECTOR_STROKE_WIDTH,
  FRAME_DEFAULT_GAP,
  FRAME_DEFAULT_PADDING,
  FRAME_DEFAULT_RADIUS,
  FRAME_DEFAULT_SIZE,
  FRAME_DEFAULT_TITLE_COLOR,
  getFrameAspectRatio,
} from '../../db/schema'
import {
  applyFrameLayout,
  canBeFrameChild,
  getSelectionBounds,
  layoutFrameChildren,
  removeChildFromAllFrames,
  sanitizeChildIds,
  sortIdsByReadingOrder,
} from './frameLayout'

export function buildEmptyFrameElement(
  projectId: string,
  canvasId: string,
  x: number,
  y: number,
  zIndex: number,
): Omit<FrameElement, 'id' | 'createdAt' | 'updatedAt'> {
  const { width, height } = FRAME_DEFAULT_SIZE
  return {
    projectId,
    canvasId,
    type: 'frame',
    x,
    y,
    width,
    height,
    rotation: 0,
    opacity: 1,
    zIndex,
    backgroundColor: FRAME_DEFAULT_BACKGROUND,
    padding: FRAME_DEFAULT_PADDING,
    radius: FRAME_DEFAULT_RADIUS,
    gap: FRAME_DEFAULT_GAP,
    columns: 0,
    childIds: [],
    aspectRatio: getFrameAspectRatio(width, height),
    title: '',
    titleColor: FRAME_DEFAULT_TITLE_COLOR,
    showConnectors: false,
    connectorColor: FRAME_DEFAULT_CONNECTOR_COLOR,
    connectorStrokeWidth: FRAME_DEFAULT_CONNECTOR_STROKE_WIDTH,
  }
}

export function mergeFrameLayout(
  elements: CanvasElement[],
  frameId: string,
): CanvasElement[] {
  return applyFrameLayout(frameId, elements)
}

export function applyElementsWithFrame(
  elements: CanvasElement[],
  frame: FrameElement,
  extra?: CanvasElement[],
): CanvasElement[] {
  const { frame: laidOutFrame, children } = layoutFrameChildren(frame, elements)
  const childMap = new Map(children.map((c) => [c.id, c]))

  const merged = elements.map((el) => {
    if (el.id === frame.id) return laidOutFrame
    if (childMap.has(el.id)) return childMap.get(el.id)!
    return el
  })

  if (extra) {
    for (const el of extra) {
      if (!merged.some((m) => m.id === el.id)) merged.push(el)
    }
  }

  const minChildZ = laidOutFrame.childIds.reduce((min, id) => {
    const el = merged.find((m) => m.id === id)
    return el ? Math.min(min, el.zIndex) : min
  }, Infinity)

  if (minChildZ !== Infinity && laidOutFrame.zIndex >= minChildZ) {
    const idx = merged.findIndex((m) => m.id === laidOutFrame.id)
    if (idx >= 0) {
      merged[idx] = { ...laidOutFrame, zIndex: minChildZ - 1 }
    }
  }

  return merged.sort((a, b) => a.zIndex - b.zIndex)
}

export async function createEmptyFrameAt(
  canvas: Canvas,
  elements: CanvasElement[],
  x: number,
  y: number,
): Promise<{ frame: FrameElement; elements: CanvasElement[] }> {
  const maxZ = elements.reduce((m, el) => Math.max(m, el.zIndex), 0)
  const draft = buildEmptyFrameElement(canvas.projectId, canvas.id, x, y, maxZ + 1)
  const frame = (await createElement(draft)) as FrameElement
  return { frame, elements: [...elements, frame] }
}

export async function createFrameFromSelection(
  canvas: Canvas,
  elements: CanvasElement[],
  selectedIds: string[],
): Promise<{ frame: FrameElement; elements: CanvasElement[]; skippedArrows: number }> {
  const selected = selectedIds
    .map((id) => elements.find((el) => el.id === id))
    .filter((el): el is CanvasElement => el != null)

  const arrows = selected.filter((el) => el.type === 'arrow' || el.type === 'frame')
  const children = selected.filter(canBeFrameChild)
  const childIds = sortIdsByReadingOrder(
    children.map((c) => c.id),
    elements,
  )

  const bounds = getSelectionBounds(children)
  const padding = FRAME_DEFAULT_PADDING
  const maxZ = elements.reduce((m, el) => Math.max(m, el.zIndex), 0)
  const minZ = children.reduce((m, el) => Math.min(m, el.zIndex), maxZ)

  const draft: Omit<FrameElement, 'id' | 'createdAt' | 'updatedAt'> = {
    projectId: canvas.projectId,
    canvasId: canvas.id,
    type: 'frame',
    x: bounds.x - padding,
    y: bounds.y - padding,
    width: bounds.width + padding * 2,
    height: bounds.height + padding * 2,
    rotation: 0,
    opacity: 1,
    zIndex: Math.max(0, minZ - 1),
    backgroundColor: FRAME_DEFAULT_BACKGROUND,
    padding,
    radius: FRAME_DEFAULT_RADIUS,
    gap: FRAME_DEFAULT_GAP,
    columns: 0,
    childIds,
    aspectRatio: getFrameAspectRatio(bounds.width + padding * 2, bounds.height + padding * 2),
    title: '',
    titleColor: FRAME_DEFAULT_TITLE_COLOR,
    showConnectors: false,
    connectorColor: FRAME_DEFAULT_CONNECTOR_COLOR,
    connectorStrokeWidth: FRAME_DEFAULT_CONNECTOR_STROKE_WIDTH,
  }

  const frame = (await createElement(draft)) as FrameElement
  let next = [...elements, frame]
  next = applyElementsWithFrame(next, frame)
  return { frame, elements: next, skippedArrows: arrows.length }
}

export function addChildToFrame(
  elements: CanvasElement[],
  frameId: string,
  childId: string,
): CanvasElement[] {
  const frame = elements.find((el): el is FrameElement => el.id === frameId && el.type === 'frame')
  const child = elements.find((el) => el.id === childId)
  if (!frame || !child || !canBeFrameChild(child)) return elements

  let next = removeChildFromAllFrames(childId, elements)
  const updatedFrame = next.find((el): el is FrameElement => el.id === frameId && el.type === 'frame')
  if (!updatedFrame) return elements

  const childIds = [...sanitizeChildIds(updatedFrame.childIds, next), childId]
  const withChildIds = next.map((el) =>
    el.id === frameId && el.type === 'frame' ? { ...el, childIds } : el,
  )
  return applyFrameLayout(frameId, withChildIds)
}

export function removeChildFromFrame(
  elements: CanvasElement[],
  frameId: string,
  childId: string,
): CanvasElement[] {
  const next = elements.map((el) => {
    if (el.id === frameId && el.type === 'frame') {
      return { ...el, childIds: el.childIds.filter((id) => id !== childId) }
    }
    return el
  })
  return applyFrameLayout(frameId, next)
}

export function reorderFrameChildren(
  elements: CanvasElement[],
  frameId: string,
  childIds: string[],
): CanvasElement[] {
  const next = elements.map((el) => {
    if (el.id === frameId && el.type === 'frame') {
      return { ...el, childIds: sanitizeChildIds(childIds, elements) }
    }
    return el
  })
  return applyFrameLayout(frameId, next)
}

export function stripChildFromFrames(elements: CanvasElement[], childId: string): CanvasElement[] {
  let next = removeChildFromAllFrames(childId, elements)
  const affected = elements
    .filter((el): el is FrameElement => el.type === 'frame' && el.childIds.includes(childId))
    .map((f) => f.id)

  for (const frameId of affected) {
    next = applyFrameLayout(frameId, next)
  }
  return next
}
