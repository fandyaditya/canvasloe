import { db } from './db'
import type { CanvasElement, FrameElement } from './schema'
import { createId } from '../utils/ids'
import { cleanupMediaForDeletedElement } from './elementMediaCleanup'
import { applyFrameLayout } from '../editor/frame/frameLayout'

export function removeElementsFromCanvas(elements: CanvasElement[], idsToRemove: string[]): CanvasElement[] {
  let next = elements.filter((el) => !idsToRemove.includes(el.id))

  for (const id of idsToRemove) {
    const affectedFrames = next
      .filter((el): el is FrameElement => el.type === 'frame' && el.childIds.includes(id))
      .map((f) => f.id)

    next = next.map((el) => {
      if (el.type === 'frame') {
        return { ...el, childIds: el.childIds.filter((cid) => cid !== id) }
      }
      return el
    })

    for (const frameId of affectedFrames) {
      next = applyFrameLayout(frameId, next)
    }
  }

  return next
}

export async function getElementsByCanvas(canvasId: string): Promise<CanvasElement[]> {
  const elements = await db.elements.where('canvasId').equals(canvasId).toArray()
  return elements.sort((a, b) => a.zIndex - b.zIndex)
}

export async function getElement(id: string): Promise<CanvasElement | undefined> {
  return db.elements.get(id)
}

export async function createElement(
  element: Omit<CanvasElement, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<CanvasElement> {
  const now = Date.now()
  const full: CanvasElement = {
    ...element,
    id: createId(),
    createdAt: now,
    updatedAt: now,
  } as CanvasElement
  await db.elements.add(full)
  return full
}

export async function updateElement(id: string, updates: Partial<CanvasElement>): Promise<void> {
  await db.elements.update(id, { ...updates, updatedAt: Date.now() } as Partial<CanvasElement>)
}

export async function deleteElement(id: string): Promise<void> {
  const element = await db.elements.get(id)
  await db.elements.delete(id)
  if (element) await cleanupMediaForDeletedElement(element)
}

export async function saveElements(canvasId: string, elements: CanvasElement[]): Promise<void> {
  await db.transaction('rw', db.elements, async () => {
    await db.elements.where('canvasId').equals(canvasId).delete()
    if (elements.length > 0) {
      await db.elements.bulkAdd(elements)
    }
  })
}

export async function duplicateElement(element: CanvasElement): Promise<CanvasElement> {
  const copies = await duplicateElementWithDependents(element)
  return copies[copies.length - 1]!
}

export async function duplicateElementWithDependents(element: CanvasElement): Promise<CanvasElement[]> {
  const now = Date.now()

  if (element.type === 'frame') {
    const frame = element as FrameElement
    const childCopies: CanvasElement[] = []
    const newChildIds: string[] = []

    for (const childId of frame.childIds) {
      const child = await db.elements.get(childId)
      if (!child) continue
      const childCopy = {
        ...child,
        id: createId(),
        x: child.x + 20,
        y: child.y + 20,
        createdAt: now,
        updatedAt: now,
      } as CanvasElement
      await db.elements.add(childCopy)
      childCopies.push(childCopy)
      newChildIds.push(childCopy.id)
    }

    const frameCopy: FrameElement = {
      ...frame,
      id: createId(),
      x: frame.x + 20,
      y: frame.y + 20,
      zIndex: frame.zIndex + 1,
      childIds: newChildIds,
      createdAt: now,
      updatedAt: now,
    }
    await db.elements.add(frameCopy)
    return [...childCopies, frameCopy]
  }

  const copy = {
    ...element,
    id: createId(),
    x: element.x + 20,
    y: element.y + 20,
    zIndex: element.zIndex + 1,
    createdAt: now,
    updatedAt: now,
  }
  await db.elements.add(copy)
  return [copy]
}
