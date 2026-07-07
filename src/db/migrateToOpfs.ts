import { db } from './db'
import type { CanvasElement, MediaAsset } from './schema'
import { createId } from '../utils/ids'
import { writeFile } from '../storage/opfs'
import {
  extensionForMime,
  mediaFilename,
  mediaPath,
} from '../storage/mediaPaths'
import { ensureCanvasFolders } from './mediaRepo'
import { notifyStorageUsageChanged } from '../utils/storageUsage'

const MIGRATION_VERSION = '1'

type LegacyImageAsset = {
  id: string
  projectId: string
  canvasId?: string
  mimeType: string
  width?: number
  height?: number
  blob?: Blob
  kind?: string
  opfsPath?: string
}

type LegacyMarkdownElement = CanvasElement & {
  type: 'markdown'
  markdown?: string
  contentId?: string
}

function isLegacyAsset(asset: LegacyImageAsset): boolean {
  return 'blob' in asset && asset.blob instanceof Blob
}

function isLegacyMarkdown(el: CanvasElement): el is LegacyMarkdownElement {
  return el.type === 'markdown' && 'markdown' in el && typeof (el as LegacyMarkdownElement).markdown === 'string'
}

export async function migrateToOpfs(): Promise<void> {
  if (localStorage.getItem('opfsMigrationVersion') === MIGRATION_VERSION) return

  let imageCount = 0
  let markdownCount = 0

  const allAssets = (await db.assets.toArray()) as LegacyImageAsset[]
  for (const asset of allAssets) {
    if (!isLegacyAsset(asset)) continue

    const canvasId = asset.canvasId ?? '_orphan'
    const projectId = asset.projectId
    await ensureCanvasFolders(projectId, canvasId)

    const kind = 'image' as const
    const filename = mediaFilename(asset.id, asset.mimeType, kind)
    const opfsPath = mediaPath(projectId, canvasId, kind, filename)
    await writeFile(opfsPath, asset.blob!)

    const updated: MediaAsset = {
      id: asset.id,
      projectId,
      canvasId,
      kind,
      mimeType: asset.mimeType,
      filename,
      opfsPath,
      width: asset.width ?? 0,
      height: asset.height ?? 0,
      size: asset.blob!.size,
      createdAt: (asset as MediaAsset).createdAt ?? Date.now(),
    }
    await db.assets.put(updated)
    imageCount++
  }

  const allElements = await db.elements.toArray()
  for (const el of allElements) {
    if (!isLegacyMarkdown(el)) continue
    if (el.contentId) continue

    const projectId = el.projectId
    const canvasId = el.canvasId
    await ensureCanvasFolders(projectId, canvasId)

    const id = createId()
    const mimeType = 'text/markdown'
    const filename = mediaFilename(id, mimeType, 'markdown')
    const opfsPath = mediaPath(projectId, canvasId, 'markdown', filename)
    const text = el.markdown ?? ''
    await writeFile(opfsPath, text)

    const mediaAsset: MediaAsset = {
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
    await db.assets.add(mediaAsset)

    const { markdown: _removed, ...rest } = el
    await db.elements.put({
      ...rest,
      contentId: id,
    } as CanvasElement)
    markdownCount++
  }

  if (imageCount > 0 || markdownCount > 0) {
    console.info(`[OPFS migration] migrated ${imageCount} images, ${markdownCount} markdown files`)
  }

  localStorage.setItem('opfsMigrationVersion', MIGRATION_VERSION)
  notifyStorageUsageChanged()
}

export function extensionFromAsset(asset: MediaAsset): string {
  return extensionForMime(asset.mimeType, asset.kind)
}
