import { db } from './db'
import type { Canvas } from './schema'
import { createId } from '../utils/ids'

export async function getCanvasesByProject(projectId: string): Promise<Canvas[]> {
  return db.canvases.where('projectId').equals(projectId).sortBy('createdAt')
}

export async function getCanvas(id: string): Promise<Canvas | undefined> {
  return db.canvases.get(id)
}

export async function createCanvas(
  projectId: string,
  name: string,
  overrides?: Partial<Canvas>,
): Promise<Canvas> {
  const now = Date.now()
  const canvas: Canvas = {
    id: createId(),
    projectId,
    name,
    width: 2400,
    height: 1600,
    background: '#FAFAFB',
    gridEnabled: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
  await db.canvases.add(canvas)
  return canvas
}

export async function updateCanvas(id: string, updates: Partial<Canvas>): Promise<void> {
  await db.canvases.update(id, { ...updates, updatedAt: Date.now() })
}

export async function deleteCanvas(id: string): Promise<void> {
  await db.elements.where('canvasId').equals(id).delete()
  await db.assets.where('canvasId').equals(id).delete()
  await db.canvases.delete(id)
}
