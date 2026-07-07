const objectUrlCache = new Map<string, string>()
const imageElementCache = new Map<string, HTMLImageElement | HTMLCanvasElement>()

export type DrawableImage = HTMLImageElement | HTMLCanvasElement

export function getObjectUrl(assetId: string, blob: Blob): string {
  const existing = objectUrlCache.get(assetId)
  if (existing) return existing
  const url = URL.createObjectURL(blob)
  objectUrlCache.set(assetId, url)
  return url
}

export async function getImageElement(assetId: string, blob: Blob): Promise<DrawableImage> {
  const existing = imageElementCache.get(assetId)
  if (existing) return existing

  if (blob.size === 0) {
    throw new Error('Image asset is empty')
  }

  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(blob)
      const canvas = document.createElement('canvas')
      canvas.width = bitmap.width
      canvas.height = bitmap.height
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Failed to create canvas context')
      ctx.drawImage(bitmap, 0, 0)
      bitmap.close()
      imageElementCache.set(assetId, canvas)
      return canvas
    } catch {
      // Fall back to object URL loading below.
    }
  }

  const url = getObjectUrl(assetId, blob)
  const img = new Image()
  img.decoding = 'async'
  img.src = url
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('Failed to load image'))
  })
  imageElementCache.set(assetId, img)
  return img
}

export function revokeAssetUrl(assetId: string): void {
  const url = objectUrlCache.get(assetId)
  if (url) {
    URL.revokeObjectURL(url)
    objectUrlCache.delete(assetId)
  }
  imageElementCache.delete(assetId)
}

export function clearObjectUrlCache(): void {
  for (const url of objectUrlCache.values()) {
    URL.revokeObjectURL(url)
  }
  objectUrlCache.clear()
  imageElementCache.clear()
}
