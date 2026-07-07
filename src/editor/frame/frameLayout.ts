import type { CanvasElement, FrameElement } from '../../db/schema'
import { getImageCaptionBlockHeight } from '../../utils/imageCaption'
import { getFrameAspectRatio } from '../../db/schema'

export type FrameBounds = { x: number; y: number; width: number; height: number }

export function isFrameElement(el: CanvasElement): el is FrameElement {
  return el.type === 'frame'
}

export function canBeFrameChild(el: CanvasElement): boolean {
  return el.type !== 'arrow' && el.type !== 'frame'
}

export function getFrameForChild(childId: string, elements: CanvasElement[]): FrameElement | undefined {
  return elements.find(
    (el): el is FrameElement => el.type === 'frame' && el.childIds.includes(childId),
  )
}

export function getChildOrderIndex(childId: string, frame: FrameElement): number {
  return frame.childIds.indexOf(childId)
}

export function sanitizeChildIds(childIds: string[], elements: CanvasElement[]): string[] {
  const ids = new Set(elements.map((el) => el.id))
  return childIds.filter((id) => ids.has(id))
}

export function computeGridColumns(childCount: number, preferredColumns?: number): number {
  if (childCount <= 0) return 1
  if (preferredColumns && preferredColumns > 0) return Math.min(preferredColumns, childCount)
  return Math.max(1, Math.ceil(Math.sqrt(childCount)))
}

export function getElementDisplaySize(el: CanvasElement): { width: number; height: number } {
  if (el.type === 'image') {
    const captionH = getImageCaptionBlockHeight(el.caption ?? '', el.width)
    return { width: el.width, height: el.height + captionH }
  }
  return { width: el.width, height: el.height }
}

export function sortIdsByReadingOrder(ids: string[], elements: CanvasElement[]): string[] {
  const map = new Map(elements.map((el) => [el.id, el]))
  return [...ids].sort((a, b) => {
    const ea = map.get(a)
    const eb = map.get(b)
    if (!ea || !eb) return 0
    const rowA = Math.floor(ea.y / 40)
    const rowB = Math.floor(eb.y / 40)
    if (rowA !== rowB) return rowA - rowB
    return ea.x - eb.x
  })
}

export function getSelectionBounds(elements: CanvasElement[]): FrameBounds {
  if (elements.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 }
  }
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const el of elements) {
    const { width, height } = getElementDisplaySize(el)
    minX = Math.min(minX, el.x)
    minY = Math.min(minY, el.y)
    maxX = Math.max(maxX, el.x + width)
    maxY = Math.max(maxY, el.y + height)
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}

function pointInRect(px: number, py: number, rect: FrameBounds): boolean {
  return px >= rect.x && px <= rect.x + rect.width && py >= rect.y && py <= rect.y + rect.height
}

export function findFrameAtPoint(
  px: number,
  py: number,
  elements: CanvasElement[],
): FrameElement | undefined {
  const frames = elements.filter(isFrameElement)
  const matches = frames.filter((f) =>
    pointInRect(px, py, { x: f.x, y: f.y, width: f.width, height: f.height }),
  )
  if (matches.length === 0) return undefined
  matches.sort((a, b) => {
    const areaA = a.width * a.height
    const areaB = b.width * b.height
    if (areaA !== areaB) return areaA - areaB
    return b.zIndex - a.zIndex
  })
  return matches[0]
}

export function removeChildFromAllFrames(
  childId: string,
  elements: CanvasElement[],
): CanvasElement[] {
  return elements.map((el) => {
    if (el.type !== 'frame' || !el.childIds.includes(childId)) return el
    return { ...el, childIds: el.childIds.filter((id) => id !== childId) }
  })
}

type LayoutResult = {
  frame: FrameElement
  children: CanvasElement[]
}

export function layoutFrameChildren(
  frame: FrameElement,
  elements: CanvasElement[],
): LayoutResult {
  const childIds = sanitizeChildIds(frame.childIds, elements)
  const children = childIds
    .map((id) => elements.find((el) => el.id === id))
    .filter((el): el is CanvasElement => el != null && canBeFrameChild(el))

  if (children.length === 0) {
    const updatedFrame: FrameElement = {
      ...frame,
      childIds: [],
      aspectRatio: getFrameAspectRatio(frame.width, frame.height),
    }
    return { frame: updatedFrame, children: [] }
  }

  const cols = computeGridColumns(children.length, frame.columns)
  const rows = Math.ceil(children.length / cols)

  const sizes = children.map(getElementDisplaySize)
  const colWidths = Array.from({ length: cols }, () => 40)
  const rowHeights = Array.from({ length: rows }, () => 40)

  for (let i = 0; i < children.length; i++) {
    const col = i % cols
    const row = Math.floor(i / cols)
    const size = sizes[i]!
    colWidths[col] = Math.max(colWidths[col], size.width)
    rowHeights[row] = Math.max(rowHeights[row], size.height)
  }

  const colOffsets: number[] = []
  let xAcc = 0
  for (let c = 0; c < cols; c++) {
    colOffsets[c] = xAcc
    xAcc += colWidths[c]! + (c < cols - 1 ? frame.gap : 0)
  }

  const rowOffsets: number[] = []
  let yAcc = 0
  for (let r = 0; r < rows; r++) {
    rowOffsets[r] = yAcc
    yAcc += rowHeights[r]! + (r < rows - 1 ? frame.gap : 0)
  }

  const contentW = xAcc
  const contentH = yAcc
  const newWidth = contentW + frame.padding * 2
  const newHeight = contentH + frame.padding * 2

  const updatedChildren: CanvasElement[] = children.map((child, index) => {
    const col = index % cols
    const row = Math.floor(index / cols)
    const size = sizes[index]!
    const cellX = frame.x + frame.padding + colOffsets[col]!
    const cellY = frame.y + frame.padding + rowOffsets[row]!
    const cellW = colWidths[col]!
    const cellH = rowHeights[row]!
    const offsetX = frame.gap === 0 ? 0 : (cellW - size.width) / 2
    const offsetY = frame.gap === 0 ? 0 : (cellH - size.height) / 2
    return { ...child, x: cellX + offsetX, y: cellY + offsetY }
  })

  const updatedFrame: FrameElement = {
    ...frame,
    childIds: children.map((c) => c.id),
    width: newWidth,
    height: newHeight,
    aspectRatio: getFrameAspectRatio(newWidth, newHeight),
  }

  return { frame: updatedFrame, children: updatedChildren }
}

export function applyFrameLayout(
  frameId: string,
  elements: CanvasElement[],
): CanvasElement[] {
  const frame = elements.find((el): el is FrameElement => el.id === frameId && el.type === 'frame')
  if (!frame) return elements

  const { frame: laidOutFrame, children } = layoutFrameChildren(frame, elements)
  const childMap = new Map(children.map((c) => [c.id, c]))

  return elements.map((el) => {
    if (el.id === frameId) return laidOutFrame
    const updated = childMap.get(el.id)
    return updated ?? el
  })
}

export function scaleFrameChildren(
  frame: FrameElement,
  prevBounds: FrameBounds,
  elements: CanvasElement[],
): CanvasElement[] {
  const childIds = sanitizeChildIds(frame.childIds, elements)
  if (childIds.length === 0) return elements

  const scaleX = prevBounds.width > 0 ? frame.width / prevBounds.width : 1
  const scaleY = prevBounds.height > 0 ? frame.height / prevBounds.height : 1
  const scale = (scaleX + scaleY) / 2

  const originX = prevBounds.x + frame.padding
  const originY = prevBounds.y + frame.padding
  const newOriginX = frame.x + frame.padding
  const newOriginY = frame.y + frame.padding

  return elements.map((el) => {
    if (!childIds.includes(el.id)) return el

    const relX = el.x - originX
    const relY = el.y - originY
    const updates: Partial<CanvasElement> = {
      x: newOriginX + relX * scale,
      y: newOriginY + relY * scale,
      width: Math.max(5, el.width * scale),
      height: Math.max(5, el.height * scale),
    }

    if (el.type === 'text') {
      return {
        ...el,
        ...updates,
        fontSize: Math.max(8, Math.round(el.fontSize * scale)),
      } as CanvasElement
    }

    return { ...el, ...updates } as CanvasElement
  })
}

export function moveFrameChildren(
  frame: FrameElement,
  dx: number,
  dy: number,
  elements: CanvasElement[],
): CanvasElement[] {
  const childIds = new Set(sanitizeChildIds(frame.childIds, elements))
  return elements.map((el) => {
    if (!childIds.has(el.id)) return el
    return { ...el, x: el.x + dx, y: el.y + dy }
  })
}

export function getElementCenter(el: CanvasElement): { x: number; y: number } {
  const { width, height } = getElementDisplaySize(el)
  return { x: el.x + width / 2, y: el.y + height / 2 }
}
