import { db } from '../db/db'
import { getOpfsTotalSize, isOpfsSupported } from '../storage/opfs'

type StorageUsageListener = () => void

const listeners = new Set<StorageUsageListener>()

export type StorageBreakdown = {
  total: number
  quota: number
  indexedDb: number
  opfs: number
  localStorage: number
}

export function subscribeStorageUsage(listener: StorageUsageListener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function notifyStorageUsageChanged(): void {
  for (const listener of listeners) {
    listener()
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getLocalStorageBytes(): number {
  let bytes = 0
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key) continue
    bytes += new Blob([key, localStorage.getItem(key) ?? '']).size
  }
  return bytes
}

async function getOpfsBytesFallback(): Promise<number> {
  const assets = await db.assets.toArray()
  const fromAssets = assets.reduce((sum, asset) => sum + asset.size, 0)
  if (fromAssets > 0) return fromAssets

  if (!isOpfsSupported()) return 0
  return getOpfsTotalSize()
}

export async function getStorageBreakdown(): Promise<StorageBreakdown> {
  const localStorageBytes = getLocalStorageBytes()
  let total = 0
  let quota = 1024 * 1024 * 1024
  let indexedDb = 0
  let opfs = 0

  if (navigator.storage?.estimate) {
    const estimate = await navigator.storage.estimate()
    total = estimate.usage ?? 0
    quota = estimate.quota ?? quota

    const details = (estimate as StorageEstimate & {
      usageDetails?: { indexedDB?: number; fileSystem?: number }
    }).usageDetails
    if (details?.indexedDB != null) indexedDb = details.indexedDB
    if (details?.fileSystem != null) opfs = details.fileSystem
  }

  if (opfs === 0) {
    opfs = await getOpfsBytesFallback()
  }

  if (indexedDb === 0 && total > 0) {
    indexedDb = Math.max(0, total - opfs - localStorageBytes)
  }

  if (total === 0) {
    total = indexedDb + opfs + localStorageBytes
  }

  return {
    total,
    quota,
    indexedDb,
    opfs,
    localStorage: localStorageBytes,
  }
}

/** @deprecated Use getStorageBreakdown */
export async function getStorageUsage(): Promise<{ used: number; quota: number }> {
  const { total, quota } = await getStorageBreakdown()
  return { used: total, quota }
}
