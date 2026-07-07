type StorageUsageListener = () => void

const listeners = new Set<StorageUsageListener>()

export function subscribeStorageUsage(listener: StorageUsageListener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function notifyStorageUsageChanged(): void {
  for (const listener of listeners) {
    listener()
  }
}
