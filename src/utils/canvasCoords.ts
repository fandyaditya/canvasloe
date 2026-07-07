export function clientToCanvasPoint(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  pan: { x: number; y: number },
  zoom: number,
) {
  return {
    x: (clientX - rect.left - pan.x) / zoom,
    y: (clientY - rect.top - pan.y) / zoom,
  }
}

export function getCanvasViewportCenter(
  viewport: { width: number; height: number },
  pan: { x: number; y: number },
  zoom: number,
) {
  return {
    x: (viewport.width / 2 - pan.x) / zoom,
    y: (viewport.height / 2 - pan.y) / zoom,
  }
}

export function getPanToCenterRect(
  rect: { x: number; y: number; width: number; height: number },
  viewport: { width: number; height: number },
  zoom: number,
) {
  const centerX = rect.x + rect.width / 2
  const centerY = rect.y + rect.height / 2
  return {
    x: viewport.width / 2 - centerX * zoom,
    y: viewport.height / 2 - centerY * zoom,
  }
}

function mimeFromFilename(name: string): string | undefined {
  const ext = name.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'webp':
      return 'image/webp'
    case 'gif':
      return 'image/gif'
    case 'svg':
      return 'image/svg+xml'
    case 'bmp':
      return 'image/bmp'
    default:
      return undefined
  }
}

export function normalizeImageFile(file: File): Blob {
  if (file.type.startsWith('image/')) return file
  const mime = mimeFromFilename(file.name)
  return mime ? file.slice(0, file.size, mime) : file
}
