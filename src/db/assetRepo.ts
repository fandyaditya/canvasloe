import { db } from './db'
import type { ImageAsset } from './schema'
import { createId } from '../utils/ids'
import { revokeAssetUrl } from '../utils/objectUrlCache'

export async function getAsset(id: string): Promise<ImageAsset | undefined> {
  return db.assets.get(id)
}

export async function getAssetsByCanvas(canvasId: string): Promise<ImageAsset[]> {
  return db.assets.where('canvasId').equals(canvasId).toArray()
}

export async function createAsset(
  data: Omit<ImageAsset, 'id' | 'createdAt'>,
): Promise<ImageAsset> {
  const asset: ImageAsset = {
    ...data,
    id: createId(),
    createdAt: Date.now(),
  }
  await db.assets.add(asset)
  return asset
}

export async function updateAssetBlob(id: string, blob: Blob, width: number, height: number): Promise<void> {
  revokeAssetUrl(id)
  await db.assets.update(id, { blob, width, height })
}

export async function deleteAsset(id: string): Promise<void> {
  revokeAssetUrl(id)
  await db.assets.delete(id)
}
