export function getImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  if (blob.size === 0) {
    return Promise.reject(new Error('Image file is empty'))
  }

  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(blob).then((bitmap) => {
      const dimensions = { width: bitmap.width, height: bitmap.height }
      bitmap.close()
      return dimensions
    })
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
      URL.revokeObjectURL(url)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to read image dimensions'))
    }
    img.src = url
  })
}

export async function getStorageUsage(): Promise<{ used: number; quota: number }> {
  if (navigator.storage?.estimate) {
    const estimate = await navigator.storage.estimate()
    return {
      used: estimate.usage ?? 0,
      quota: estimate.quota ?? 1024 * 1024 * 1024,
    }
  }
  return { used: 0, quota: 1024 * 1024 * 1024 }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
