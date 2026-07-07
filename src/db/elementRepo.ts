import { db } from './db'
import type { CanvasElement } from './schema'
import { createId } from '../utils/ids'

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
  await db.elements.delete(id)
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
  const now = Date.now()
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
  return copy
}
