import { createProject } from './projectRepo'
import { createCanvas } from './canvasRepo'
import { createElement } from './elementRepo'
import { createMarkdownMedia } from './mediaRepo'
import { db } from './db'
import type { TextElement, ShapeElement, ArrowElement, MarkdownElement } from './schema'
import { MARKDOWN_DEFAULT_CONTENT } from './schema'

export async function seedDatabaseIfEmpty(): Promise<void> {
  const count = await db.projects.count()
  if (count > 0) return

  const studio = await createProject('Studio Project')
  const personal = await createProject('Personal')
  const travel = await createProject('Travel Inspiration')

  const brandDirection = await createCanvas(studio.id, 'Brand Direction')
  await createCanvas(studio.id, 'Moodboard')
  await createCanvas(studio.id, 'Color & Typography')
  await createCanvas(studio.id, 'Logo Ideas')
  await createCanvas(personal.id, 'Ideas')
  await createCanvas(personal.id, 'Sketches')
  await createCanvas(travel.id, 'Beach')
  await createCanvas(travel.id, 'Mountains')
  await createCanvas(travel.id, 'Cities')

  const pid = studio.id
  const cid = brandDirection.id

  const elements: Array<
    | Omit<TextElement, 'id' | 'createdAt' | 'updatedAt'>
    | Omit<ShapeElement, 'id' | 'createdAt' | 'updatedAt'>
    | Omit<ArrowElement, 'id' | 'createdAt' | 'updatedAt'>
    | Omit<MarkdownElement, 'id' | 'createdAt' | 'updatedAt'>
  > = [
    // Interior image placeholder
    {
      projectId: pid, canvasId: cid, type: 'shape', shape: 'rect',
      x: 80, y: 120, width: 220, height: 160, rotation: 0, opacity: 1, zIndex: 1,
      fill: '#D4C4B0', fillOpacity: 1, stroke: '#E5E7EB', strokeOpacity: 1, strokeWidth: 1, radius: 8,
    },
    // Sticky note
    {
      projectId: pid, canvasId: cid, type: 'shape', shape: 'rect',
      x: 340, y: 100, width: 200, height: 140, rotation: 0, opacity: 1, zIndex: 2,
      fill: '#E7DCC6', fillOpacity: 1, stroke: '#D6C9AE', strokeOpacity: 0.5, strokeWidth: 1, radius: 4,
    },
    // Color palette card background
    {
      projectId: pid, canvasId: cid, type: 'shape', shape: 'rect',
      x: 580, y: 100, width: 100, height: 220, rotation: 0, opacity: 1, zIndex: 3,
      fill: '#FFFFFF', fillOpacity: 1, stroke: '#E5E7EB', strokeOpacity: 1, strokeWidth: 1, radius: 8,
    },
    // Color swatches
    {
      projectId: pid, canvasId: cid, type: 'shape', shape: 'rect',
      x: 592, y: 112, width: 76, height: 40, rotation: 0, opacity: 1, zIndex: 4,
      fill: '#4D6B57', fillOpacity: 1, stroke: 'transparent', strokeOpacity: 0, strokeWidth: 0, radius: 4,
    },
    {
      projectId: pid, canvasId: cid, type: 'shape', shape: 'rect',
      x: 592, y: 160, width: 76, height: 40, rotation: 0, opacity: 1, zIndex: 5,
      fill: '#E7DCC6', fillOpacity: 1, stroke: 'transparent', strokeOpacity: 0, strokeWidth: 0, radius: 4,
    },
    {
      projectId: pid, canvasId: cid, type: 'shape', shape: 'rect',
      x: 592, y: 208, width: 76, height: 40, rotation: 0, opacity: 1, zIndex: 6,
      fill: '#F5F2EE', fillOpacity: 1, stroke: 'transparent', strokeOpacity: 0, strokeWidth: 0, radius: 4,
    },
    {
      projectId: pid, canvasId: cid, type: 'shape', shape: 'rect',
      x: 592, y: 256, width: 76, height: 40, rotation: 0, opacity: 1, zIndex: 7,
      fill: '#1E1E1E', fillOpacity: 1, stroke: 'transparent', strokeOpacity: 0, strokeWidth: 0, radius: 4,
    },
    // Hex labels
    {
      projectId: pid, canvasId: cid, type: 'text',
      x: 592, y: 148, width: 76, height: 16, rotation: 0, opacity: 1, zIndex: 8,
      text: '#4D6B57', fontFamily: 'Inter', fontSize: 9, fontWeight: 'regular',
      italic: false, underline: false, textAlign: 'center', color: '#FFFFFF',
    },
    {
      projectId: pid, canvasId: cid, type: 'text',
      x: 592, y: 196, width: 76, height: 16, rotation: 0, opacity: 1, zIndex: 9,
      text: '#E7DCC6', fontFamily: 'Inter', fontSize: 9, fontWeight: 'regular',
      italic: false, underline: false, textAlign: 'center', color: '#6B7280',
    },
    {
      projectId: pid, canvasId: cid, type: 'text',
      x: 592, y: 244, width: 76, height: 16, rotation: 0, opacity: 1, zIndex: 10,
      text: '#F5F2EE', fontFamily: 'Inter', fontSize: 9, fontWeight: 'regular',
      italic: false, underline: false, textAlign: 'center', color: '#6B7280',
    },
    {
      projectId: pid, canvasId: cid, type: 'text',
      x: 592, y: 292, width: 76, height: 16, rotation: 0, opacity: 1, zIndex: 11,
      text: '#1E1E1E', fontFamily: 'Inter', fontSize: 9, fontWeight: 'regular',
      italic: false, underline: false, textAlign: 'center', color: '#FFFFFF',
    },
    // Coast image placeholder
    {
      projectId: pid, canvasId: cid, type: 'shape', shape: 'rect',
      x: 80, y: 320, width: 180, height: 140, rotation: 0, opacity: 1, zIndex: 12,
      fill: '#8BA4B4', fillOpacity: 1, stroke: '#E5E7EB', strokeOpacity: 1, strokeWidth: 1, radius: 4,
    },
    // Polaroid placeholder
    {
      projectId: pid, canvasId: cid, type: 'shape', shape: 'rect',
      x: 300, y: 300, width: 140, height: 170, rotation: -3, opacity: 1, zIndex: 13,
      fill: '#FFFFFF', fillOpacity: 1, stroke: '#E5E7EB', strokeOpacity: 1, strokeWidth: 1, radius: 2,
    },
    {
      projectId: pid, canvasId: cid, type: 'shape', shape: 'rect',
      x: 310, y: 310, width: 120, height: 100, rotation: -3, opacity: 1, zIndex: 14,
      fill: '#C4A882', fillOpacity: 1, stroke: 'transparent', strokeOpacity: 0, strokeWidth: 0, radius: 0,
    },
    // Sticky note text
    {
      projectId: pid, canvasId: cid, type: 'text',
      x: 355, y: 155, width: 170, height: 60, rotation: 0, opacity: 1, zIndex: 15,
      text: 'Simplicity is the ultimate sophistication.',
      fontFamily: 'Inter', fontSize: 13, fontWeight: 'regular',
      italic: false, underline: false, textAlign: 'left', color: '#1E1E1E',
    },
    // Brand Direction title
    {
      projectId: pid, canvasId: cid, type: 'text',
      x: 480, y: 380, width: 420, height: 80, rotation: 0, opacity: 1, zIndex: 16,
      text: 'Brand Direction',
      fontFamily: 'Playfair Display', fontSize: 64, fontWeight: 'regular',
      italic: false, underline: false, textAlign: 'left', color: '#1E1E1E',
    },
    // Arrow annotation
    {
      projectId: pid, canvasId: cid, type: 'arrow',
      x: 440, y: 420, width: 60, height: 60, rotation: 0, opacity: 1, zIndex: 17,
      stroke: '#1E1E1E', strokeOpacity: 1, strokeWidth: 2,
      dashed: false, startHead: false, endHead: true,
      points: [0, 50, 50, 0],
    },
  ]

  for (const el of elements) {
    await createElement(el)
  }

  const mdMedia = await createMarkdownMedia(pid, cid, MARKDOWN_DEFAULT_CONTENT)
  await createElement({
    projectId: pid,
    canvasId: cid,
    type: 'markdown',
    x: 700,
    y: 100,
    width: 200,
    height: 168,
    rotation: 0,
    opacity: 1,
    zIndex: 18,
    contentId: mdMedia.id,
    fontFamily: 'Inter',
    textColor: '#111827',
    backgroundColor: '#FFFFFF',
    padding: 16,
    radius: 12,
  } as Omit<MarkdownElement, 'id' | 'createdAt' | 'updatedAt'>)

  localStorage.setItem('activeProjectId', studio.id)
  localStorage.setItem('activeCanvasId', brandDirection.id)
}

export async function ensureActiveCanvas(): Promise<string | null> {
  const SEED_VERSION = '8'
  if (localStorage.getItem('seedVersion') !== SEED_VERSION) {
    await db.transaction('rw', [db.projects, db.canvases, db.elements, db.assets], async () => {
      await db.projects.clear()
      await db.canvases.clear()
      await db.elements.clear()
      await db.assets.clear()
    })
    localStorage.removeItem('activeCanvasId')
    localStorage.removeItem('activeProjectId')
    localStorage.setItem('seedVersion', SEED_VERSION)
  }

  await seedDatabaseIfEmpty()

  let activeCanvasId = localStorage.getItem('activeCanvasId')
  if (!activeCanvasId) {
    const brandCanvas = await db.canvases.filter((c) => c.name === 'Brand Direction').first()
    const fallback = brandCanvas ?? (await db.canvases.orderBy('createdAt').first())
    if (fallback) {
      activeCanvasId = fallback.id
      localStorage.setItem('activeCanvasId', fallback.id)
      localStorage.setItem('activeProjectId', fallback.projectId)
    }
  }

  return activeCanvasId
}
