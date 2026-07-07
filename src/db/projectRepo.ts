import { db } from './db'
import type { Project } from './schema'
import { createId } from '../utils/ids'
import { deleteCanvasMedia, deleteProjectMedia } from './mediaRepo'

export async function getAllProjects(): Promise<Project[]> {
  return db.projects.orderBy('createdAt').toArray()
}

export async function getProject(id: string): Promise<Project | undefined> {
  return db.projects.get(id)
}

export async function createProject(name: string): Promise<Project> {
  const now = Date.now()
  const project: Project = {
    id: createId(),
    name,
    createdAt: now,
    updatedAt: now,
  }
  await db.projects.add(project)
  return project
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<void> {
  await db.projects.update(id, { ...updates, updatedAt: Date.now() })
}

export async function deleteProject(id: string): Promise<void> {
  const canvases = await db.canvases.where('projectId').equals(id).toArray()
  for (const canvas of canvases) {
    await db.elements.where('canvasId').equals(canvas.id).delete()
    await deleteCanvasMedia(id, canvas.id)
    await db.canvases.delete(canvas.id)
  }
  await deleteProjectMedia(id)
  await db.projects.delete(id)
}
