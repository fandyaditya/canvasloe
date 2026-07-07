let measureCanvas: HTMLCanvasElement | null = null

function getMeasureContext(font: string): CanvasRenderingContext2D {
  if (!measureCanvas) measureCanvas = document.createElement('canvas')
  const ctx = measureCanvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')
  ctx.font = font
  return ctx
}

export function estimateWrappedTextHeight(
  text: string,
  maxWidth: number,
  fontSize: number,
  options?: {
    fontFamily?: string
    fontStyle?: string
    lineHeight?: number
  },
): number {
  if (!text.trim() || maxWidth <= 0) return 0

  const fontFamily = options?.fontFamily ?? 'Inter'
  const fontStyle = options?.fontStyle ?? 'normal'
  const lineHeight = options?.lineHeight ?? 1
  const ctx = getMeasureContext(`${fontStyle} ${fontSize}px ${fontFamily}`)

  let lines = 1
  let line = ''

  for (const word of text.split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines += 1
      line = word
    } else {
      line = candidate
    }
  }

  return lines * fontSize * lineHeight
}
