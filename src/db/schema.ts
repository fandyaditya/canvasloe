export type Project = {
  id: string
  name: string
  createdAt: number
  updatedAt: number
}

export type Canvas = {
  id: string
  projectId: string
  name: string
  width: number
  height: number
  background: string
  gridEnabled: boolean
  thumbnailAssetId?: string
  createdAt: number
  updatedAt: number
}

export type ElementType = 'text' | 'image' | 'shape' | 'arrow' | 'palette' | 'markdown' | 'frame'

export type BaseElement = {
  id: string
  projectId: string
  canvasId: string
  type: ElementType
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  zIndex: number
  locked?: boolean
  hidden?: boolean
  createdAt: number
  updatedAt: number
}

export type TextElement = BaseElement & {
  type: 'text'
  text: string
  fontFamily: string
  fontSize: number
  fontWeight: 'regular' | 'medium' | 'semibold' | 'bold'
  italic: boolean
  underline: boolean
  textAlign: 'left' | 'center' | 'right'
  color: string
}

export type ImageElement = BaseElement & {
  type: 'image'
  assetId: string
  fit: 'contain' | 'cover' | 'stretch'
  radius: number
  caption: string
}

export const IMAGE_CAPTION_GAP = 6
export const IMAGE_CAPTION_FONT_SIZE = 11
export const IMAGE_CAPTION_LINE_HEIGHT = 1.4

export type ShapeElement = BaseElement & {
  type: 'shape'
  shape: 'rect' | 'circle'
  fill: string
  fillOpacity: number
  stroke: string
  strokeOpacity: number
  strokeWidth: number
  radius?: number
}

export type ArrowElement = BaseElement & {
  type: 'arrow'
  stroke: string
  strokeOpacity: number
  strokeWidth: number
  dashed: boolean
  startHead: boolean
  endHead: boolean
  points: number[]
}

/** Invisible padding around arrow stroke for easier click / marquee selection */
export const ARROW_HIT_STROKE_WIDTH = 28

export type PaletteElement = BaseElement & {
  type: 'palette'
  colors: string[]
  colorCount: number
}

export type MarkdownElement = BaseElement & {
  type: 'markdown'
  contentId: string
  fontFamily: string
  textColor: string
  backgroundColor: string
  padding: number
  radius: number
}

export type FrameElement = BaseElement & {
  type: 'frame'
  backgroundColor: string
  padding: number
  radius: number
  gap: number
  columns: number
  childIds: string[]
  aspectRatio: number
}

export const FRAME_DEFAULT_SIZE = { width: 480, height: 360 } as const
export const FRAME_MIN_WIDTH = 200
export const FRAME_MAX_WIDTH = 2400
export const FRAME_MIN_HEIGHT = 150
export const FRAME_MAX_HEIGHT = 1600
export const FRAME_DEFAULT_PADDING = 24
export const FRAME_DEFAULT_GAP = 16
export const FRAME_DEFAULT_RADIUS = 16
export const FRAME_DEFAULT_BACKGROUND = '#FFFFFF'
export const FRAME_MAX_CHILDREN = 24

export function getFrameAspectRatio(width: number, height: number): number {
  return height > 0 ? width / height : 1
}

export function clampFrameSize(width: number, height: number): { width: number; height: number } {
  let w = Math.max(FRAME_MIN_WIDTH, Math.min(FRAME_MAX_WIDTH, width))
  let h = Math.max(FRAME_MIN_HEIGHT, Math.min(FRAME_MAX_HEIGHT, height))
  const ratio = w / h
  const minRatio = FRAME_MIN_WIDTH / FRAME_MAX_HEIGHT
  const maxRatio = FRAME_MAX_WIDTH / FRAME_MIN_HEIGHT
  if (ratio < minRatio) w = h * minRatio
  if (ratio > maxRatio) h = w / maxRatio
  return {
    width: Math.max(FRAME_MIN_WIDTH, Math.min(FRAME_MAX_WIDTH, w)),
    height: Math.max(FRAME_MIN_HEIGHT, Math.min(FRAME_MAX_HEIGHT, h)),
  }
}

export const MARKDOWN_DEFAULT_CONTENT = `# Brand Direction

A calm, editorial moodboard for the studio rebrand.

- Earth tones and soft neutrals
- Serif headlines with sans body copy
- Generous whitespace and tactile textures`

export const MARKDOWN_DEFAULT_SIZE = { width: 200, height: 168 } as const

export const MARKDOWN_ASPECT_RATIO = MARKDOWN_DEFAULT_SIZE.width / MARKDOWN_DEFAULT_SIZE.height

export const MARKDOWN_CARD_PADDING = 16
export const MARKDOWN_CARD_RADIUS = 12

export const PALETTE_DEFAULT_COLORS = ['#4D6B57', '#E7DCC6', '#F5F2EE'] as const
export const PALETTE_EXTRA_COLORS = ['#1E1E1E', '#8B7355', '#C4A882'] as const
export const PALETTE_SLOT_LABELS = [
  'Primary',
  'Secondary',
  'Tertiary',
  'Quaternary',
  'Quinary',
  'Senary',
] as const

const PALETTE_PADDING = 12
const PALETTE_SWATCH_WIDTH = 76
const PALETTE_SWATCH_HEIGHT = 40
const PALETTE_TEXT_GAP = 4
const PALETTE_TEXT_HEIGHT = 12
const PALETTE_ROW_GAP = 8

export function getPaletteDimensions(colorCount: number): { width: number; height: number } {
  const rowHeight = PALETTE_SWATCH_HEIGHT + PALETTE_TEXT_GAP + PALETTE_TEXT_HEIGHT
  return {
    width: PALETTE_PADDING * 2 + PALETTE_SWATCH_WIDTH,
    height: PALETTE_PADDING * 2 + colorCount * rowHeight + (colorCount - 1) * PALETTE_ROW_GAP,
  }
}

export function getPaletteAspectRatio(colorCount: number): number {
  const { width, height } = getPaletteDimensions(colorCount)
  return width / height
}

export function paletteColorsForCount(current: string[], colorCount: number): string[] {
  const colors = current.slice(0, colorCount)
  while (colors.length < colorCount) {
    colors.push(PALETTE_EXTRA_COLORS[colors.length - PALETTE_DEFAULT_COLORS.length] ?? '#CCCCCC')
  }
  return colors
}

export type CanvasElement =
  | TextElement
  | ImageElement
  | ShapeElement
  | ArrowElement
  | PaletteElement
  | MarkdownElement
  | FrameElement

export type MediaKind = 'image' | 'video' | 'markdown'

export type MediaAsset = {
  id: string
  projectId: string
  canvasId: string
  kind: MediaKind
  mimeType: string
  filename: string
  opfsPath: string
  width?: number
  height?: number
  size: number
  createdAt: number
}

/** @deprecated Use MediaAsset */
export type ImageAsset = MediaAsset

export type CanvasSnapshot = {
  elements: CanvasElement[]
}

export type CanvasHistory = {
  past: CanvasSnapshot[]
  present: CanvasSnapshot
  future: CanvasSnapshot[]
}

export type Tool = 'select' | 'rect' | 'circle' | 'arrow' | 'text' | 'color' | 'hand' | 'markdown' | 'frame'

export type SaveStatus = 'saved' | 'saving' | 'error'
