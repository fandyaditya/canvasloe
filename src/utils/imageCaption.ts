import { IMAGE_CAPTION_FONT_SIZE, IMAGE_CAPTION_GAP, IMAGE_CAPTION_LINE_HEIGHT } from '../db/schema'

const CAPTION_LINE_HEIGHT_PX = IMAGE_CAPTION_FONT_SIZE * IMAGE_CAPTION_LINE_HEIGHT

export function getImageCaptionBlockHeight(caption: string, width: number): number {
  const text = caption.trim()
  if (!text) return 0

  const charsPerLine = Math.max(8, Math.floor(width / (IMAGE_CAPTION_FONT_SIZE * 0.55)))
  const lines = Math.ceil(text.length / charsPerLine)
  return IMAGE_CAPTION_GAP + lines * CAPTION_LINE_HEIGHT_PX
}
