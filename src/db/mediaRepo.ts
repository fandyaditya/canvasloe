import { db } from './db'
import type { MediaAsset } from './schema'
import { createId } from '../utils/ids'
import { revokeAssetUrl } from '../utils/objectUrlCache'
import {
  deleteDirectory,
  deleteFile,
  ensureDirectory,
  readFile,
  readText,
  writeFile,
} from '../storage/opfs'
import {
  canvasMediaRoot,
  kindFolder,
  mediaFilename,
  mediaPath,
} from '../storage/mediaPaths'
import { notifyStorageUsageChanged } from '../utils/storageUsage'

function touchStorageUsage(): void {
  notifyStorageUsageChanged()
}

async function ensureCanvasFolders(projectId: string, canvasId: string): Promise<void> {
  const root = canvasMediaRoot(projectId, canvasId)
  await ensureDirectory(`${root}/images`)
  await ensureDirectory(`${root}/videos`)
  await ensureDirectory(`${root}/md`)
}

export async function getMedia(id: string): Promise<MediaAsset | undefined> {
  return db.assets.get(id)
}

export async function getMediaByCanvas(canvasId: string): Promise<MediaAsset[]> {
  return db.assets.where('canvasId').equals(canvasId).toArray()
}

export async function createImageMedia(
  projectId: string,
  canvasId: string,
  blob: Blob,
  dims: { width: number; height: number },
): Promise<MediaAsset> {
  await ensureCanvasFolders(projectId, canvasId)
  const id = createId()
  const mimeType = blob.type || 'image/png'
  const filename = mediaFilename(id, mimeType, 'image')
  const opfsPath = mediaPath(projectId, canvasId, 'image', filename)
  await writeFile(opfsPath, blob)

  const asset: MediaAsset = {
    id,
    projectId,
    canvasId,
    kind: 'image',
    mimeType,
    filename,
    opfsPath,
    width: dims.width,
    height: dims.height,
    size: blob.size,
    createdAt: Date.now(),
  }
  await db.assets.add(asset)
  touchStorageUsage()
  return asset
}

export async function createMarkdownMedia(
  projectId: string,
  canvasId: string,
  text: string,
): Promise<MediaAsset> {
  await ensureCanvasFolders(projectId, canvasId)
  const id = createId()
  const mimeType = 'text/markdown'
  const filename = mediaFilename(id, mimeType, 'markdown')
  const opfsPath = mediaPath(projectId, canvasId, 'markdown', filename)
  await writeFile(opfsPath, text)

  const asset: MediaAsset = {
    id,
    projectId,
    canvasId,
    kind: 'markdown',
    mimeType,
    filename,
    opfsPath,
    size: new Blob([text]).size,
    createdAt: Date.now(),
  }
  await db.assets.add(asset)
  touchStorageUsage()
  return asset
}

export async function updateImageMedia(
  id: string,
  blob: Blob,
  dims: { width: number; height: number },
): Promise<void> {
  const asset = await db.assets.get(id)
  if (!asset || asset.kind !== 'image') throw new Error('Image media not found')
  revokeAssetUrl(id)
  await writeFile(asset.opfsPath, blob)
  await db.assets.update(id, {
    width: dims.width,
    height: dims.height,
    size: blob.size,
    mimeType: blob.type || asset.mimeType,
  })
  touchStorageUsage()
}

export async function updateMarkdownContent(id: string, text: string): Promise<void> {
  const asset = await db.assets.get(id)
  if (!asset || asset.kind !== 'markdown') throw new Error('Markdown media not found')
  await writeFile(asset.opfsPath, text)
  await db.assets.update(id, { size: new Blob([text]).size })
  touchStorageUsage()
}

export async function readMediaBlob(id: string): Promise<Blob> {
  const asset = await db.assets.get(id)
  if (!asset) throw new Error('Media not found')
  return readFile(asset.opfsPath)
}

export async function readMarkdownContent(id: string): Promise<string> {
  const asset = await db.assets.get(id)
  if (!asset || asset.kind !== 'markdown') throw new Error('Markdown media not found')
  return readText(asset.opfsPath)
}

export async function isMediaReferenced(id: string): Promise<boolean> {
  const imageRefs = await db.elements.filter((el) => el.type === 'image' && el.assetId === id).count()
  if (imageRefs > 0) return true
  const mdRefs = await db.elements.filter((el) => el.type === 'markdown' && el.contentId === id).count()
  return mdRefs > 0
}

export async function deleteMediaIfUnreferenced(id: string): Promise<void> {
  if (await isMediaReferenced(id)) return
  const asset = await db.assets.get(id)
  if (!asset) return
  revokeAssetUrl(id)
  try {
    await deleteFile(asset.opfsPath)
  } catch {
    // File may already be gone
  }
  await db.assets.delete(id)
  touchStorageUsage()
}

export async function deleteMedia(id: string): Promise<void> {
  const asset = await db.assets.get(id)
  if (!asset) return
  revokeAssetUrl(id)
  try {
    await deleteFile(asset.opfsPath)
  } catch {
    // File may already be gone
  }
  await db.assets.delete(id)
  touchStorageUsage()
}

export async function deleteCanvasMedia(projectId: string, canvasId: string): Promise<void> {
  const assets = await db.assets.where('canvasId').equals(canvasId).toArray()
  for (const asset of assets) {
    revokeAssetUrl(asset.id)
  }
  try {
    await deleteDirectory(canvasMediaRoot(projectId, canvasId))
  } catch {
    // Directory may not exist
  }
  await db.assets.where('canvasId').equals(canvasId).delete()
  touchStorageUsage()
}

export async function deleteProjectMedia(projectId: string): Promise<void> {
  const assets = await db.assets.where('projectId').equals(projectId).toArray()
  for (const asset of assets) {
    revokeAssetUrl(asset.id)
  }
  try {
    await deleteDirectory(projectId)
  } catch {
    // Directory may not exist
  }
  await db.assets.where('projectId').equals(projectId).delete()
  touchStorageUsage()
}

export { ensureCanvasFolders, kindFolder }

// Legacy aliases
export const getAsset = getMedia
export const getAssetsByCanvas = getMediaByCanvas
export const createAsset = createImageMedia
export const updateAssetBlob = updateImageMedia
export const deleteAsset = deleteMedia
