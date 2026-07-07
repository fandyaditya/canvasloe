import Dexie, { type EntityTable } from 'dexie'
import type { Canvas, CanvasElement, ImageAsset, Project } from './schema'

export class MoodboardDB extends Dexie {
  projects!: EntityTable<Project, 'id'>
  canvases!: EntityTable<Canvas, 'id'>
  elements!: EntityTable<CanvasElement, 'id'>
  assets!: EntityTable<ImageAsset, 'id'>

  constructor() {
    super('MoodboardDB')
    this.version(1).stores({
      projects: 'id, name, updatedAt',
      canvases: 'id, projectId, name, updatedAt',
      elements: 'id, projectId, canvasId, type, zIndex, updatedAt',
      assets: 'id, projectId, canvasId, mimeType, createdAt',
    })
    this.version(2).stores({
      projects: 'id, name, updatedAt, createdAt',
      canvases: 'id, projectId, name, updatedAt, createdAt',
      elements: 'id, projectId, canvasId, type, zIndex, updatedAt',
      assets: 'id, projectId, canvasId, mimeType, createdAt',
    })
  }
}

export const db = new MoodboardDB()
