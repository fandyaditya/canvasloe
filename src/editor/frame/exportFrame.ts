import Konva from 'konva'
import type { CanvasElement, FrameElement, ImageElement, MarkdownElement, PaletteElement, ShapeElement, TextElement } from '../../db/schema'
import {
  MARKDOWN_CARD_PADDING,
  MARKDOWN_CARD_RADIUS,
  IMAGE_CAPTION_FONT_SIZE,
  IMAGE_CAPTION_GAP,
  IMAGE_CAPTION_LINE_HEIGHT,
  FRAME_TITLE_FONT_SIZE,
  FRAME_TITLE_FLOAT_GAP,
  getFrameTitleNotchLayout,
} from '../../db/schema'
import { readMediaBlob } from '../../db/mediaRepo'
import { getImageElement } from '../../utils/objectUrlCache'
import { getImageCaptionBlockHeight } from '../../utils/imageCaption'
import { extractMarkdownTitle, getCanvasPreviewBlocks, isMarkdownTruncated } from '../../utils/markdown'
import { layoutMarkdownPreviewBlocks, PREVIEW_FOOTER_RESERVE } from '../../utils/markdownCanvasLayout'
import { estimateWrappedTextHeight } from '../../utils/textMeasure'
import { addMarkdownPreviewItemsToGroup } from '../components/MarkdownCanvasPreview'
import { getChildOrderIndex, normalizeFrame } from './frameLayout'

const BADGE_SIZE = 20
const EXPORT_EDGE_PADDING = 8

const weightMap = {
  regular: 'normal',
  medium: '500',
  semibold: '600',
  bold: 'bold',
} as const

const PALETTE_PADDING = 12
const PALETTE_SWATCH_WIDTH = 76
const PALETTE_SWATCH_HEIGHT = 40
const PALETTE_ROW_GAP = 8
const PALETTE_TEXT_GAP = 4
const PALETTE_ROW_HEIGHT = PALETTE_SWATCH_HEIGHT + PALETTE_TEXT_GAP + 12

function drawTitleNotch(layer: Konva.Layer, frame: FrameElement, edgePad: number, topExtra: number) {
  const normalized = normalizeFrame(frame)
  const layout = getFrameTitleNotchLayout(normalized)
  if (!layout) return

  layer.add(
    new Konva.Text({
      x: layout.x - frame.x + edgePad,
      y: layout.y - frame.y + edgePad + topExtra,
      width: layout.width,
      text: layout.title,
      fontSize: FRAME_TITLE_FONT_SIZE,
      fontFamily: 'Inter',
      fontStyle: 'bold',
      fill: normalized.titleColor,
      align: 'center',
    }),
  )
}

function relPos(frame: FrameElement, el: CanvasElement, edgePad: number, topExtra: number) {
  return {
    x: el.x - frame.x + edgePad,
    y: el.y - frame.y + edgePad + topExtra,
  }
}

function drawBadge(layer: Konva.Layer, x: number, y: number, order: number) {
  const g = new Konva.Group({ x: x - 4, y: y - 4 })
  g.add(
    new Konva.Circle({
      x: BADGE_SIZE / 2,
      y: BADGE_SIZE / 2,
      radius: BADGE_SIZE / 2,
      fill: '#5B4DFF',
    }),
  )
  g.add(
    new Konva.Text({
      x: 0,
      y: 4,
      width: BADGE_SIZE,
      text: String(order),
      fontSize: 11,
      fontFamily: 'Inter',
      fill: '#FFFFFF',
      align: 'center',
    }),
  )
  layer.add(g)
}

async function drawImage(layer: Konva.Layer, el: ImageElement, x: number, y: number) {
  const blob = await readMediaBlob(el.assetId)
  const img = await getImageElement(el.assetId, blob)
  const caption = el.caption ?? ''
  const captionH = getImageCaptionBlockHeight(caption, el.width)

  const g = new Konva.Group({ x, y, rotation: el.rotation, opacity: el.opacity })
  if (el.radius > 0) {
    g.clipFunc((ctx) => {
      const w = el.width
      const h = el.height
      const r = el.radius
      ctx.beginPath()
      ctx.moveTo(r, 0)
      ctx.lineTo(w - r, 0)
      ctx.quadraticCurveTo(w, 0, w, r)
      ctx.lineTo(w, h - r)
      ctx.quadraticCurveTo(w, h, w - r, h)
      ctx.lineTo(r, h)
      ctx.quadraticCurveTo(0, h, 0, h - r)
      ctx.lineTo(0, r)
      ctx.quadraticCurveTo(0, 0, r, 0)
      ctx.closePath()
    })
  }
  g.add(new Konva.Image({ image: img, width: el.width, height: el.height }))
  layer.add(g)

  if (caption.trim()) {
    layer.add(
      new Konva.Text({
        x,
        y: y + el.height + IMAGE_CAPTION_GAP,
        width: el.width,
        text: caption,
        fontFamily: 'Inter',
        fontSize: IMAGE_CAPTION_FONT_SIZE,
        lineHeight: IMAGE_CAPTION_LINE_HEIGHT,
        fill: '#6B7280',
        align: 'center',
        wrap: 'word',
        rotation: el.rotation,
        opacity: el.opacity,
      }),
    )
  }
  return el.height + captionH
}

function drawText(layer: Konva.Layer, el: TextElement, x: number, y: number) {
  layer.add(
    new Konva.Text({
      x,
      y,
      width: el.width,
      text: el.text,
      fontFamily: el.fontFamily,
      fontSize: el.fontSize,
      fontStyle: `${el.italic ? 'italic ' : ''}${weightMap[el.fontWeight]}`,
      textDecoration: el.underline ? 'underline' : '',
      align: el.textAlign,
      fill: el.color,
      opacity: el.opacity,
      rotation: el.rotation,
    }),
  )
}

function drawShape(layer: Konva.Layer, el: ShapeElement, x: number, y: number) {
  if (el.shape === 'circle') {
    layer.add(
      new Konva.Circle({
        x: x + el.width / 2,
        y: y + el.height / 2,
        radius: el.width / 2,
        fill: el.fill,
        opacity: el.opacity * el.fillOpacity,
        stroke: el.stroke,
        strokeWidth: el.strokeWidth,
        rotation: el.rotation,
      }),
    )
    return
  }
  layer.add(
    new Konva.Rect({
      x,
      y,
      width: el.width,
      height: el.height,
      fill: el.fill,
      opacity: el.opacity * el.fillOpacity,
      stroke: el.stroke,
      strokeWidth: el.strokeWidth,
      cornerRadius: el.radius ?? 0,
      rotation: el.rotation,
    }),
  )
}

function drawPalette(layer: Konva.Layer, el: PaletteElement, x: number, y: number) {
  const baseWidth = PALETTE_PADDING * 2 + PALETTE_SWATCH_WIDTH
  const baseHeight =
    PALETTE_PADDING * 2 +
    el.colorCount * PALETTE_ROW_HEIGHT +
    (el.colorCount - 1) * PALETTE_ROW_GAP
  const scale = el.width / baseWidth
  const g = new Konva.Group({ x, y, scaleX: scale, scaleY: scale, opacity: el.opacity, rotation: el.rotation })
  g.add(
    new Konva.Rect({
      width: baseWidth,
      height: baseHeight,
      fill: '#FFFFFF',
      cornerRadius: 8,
      stroke: '#E5E7EB',
      strokeWidth: 1,
    }),
  )
  el.colors.slice(0, el.colorCount).forEach((color, index) => {
    const rowY = PALETTE_PADDING + index * (PALETTE_ROW_HEIGHT + PALETTE_ROW_GAP)
    g.add(
      new Konva.Rect({
        x: PALETTE_PADDING,
        y: rowY,
        width: PALETTE_SWATCH_WIDTH,
        height: PALETTE_SWATCH_HEIGHT,
        fill: color,
        cornerRadius: 4,
      }),
    )
    g.add(
      new Konva.Text({
        x: PALETTE_PADDING,
        y: rowY + PALETTE_SWATCH_HEIGHT + PALETTE_TEXT_GAP,
        width: PALETTE_SWATCH_WIDTH,
        text: color.toUpperCase(),
        fontFamily: 'Inter',
        fontSize: 9,
        fill: '#6B7280',
        align: 'center',
      }),
    )
  })
  layer.add(g)
}

function drawMarkdown(layer: Konva.Layer, el: MarkdownElement, markdown: string, x: number, y: number) {
  const title = extractMarkdownTitle(markdown)
  const previewBlocks = getCanvasPreviewBlocks(markdown, 4)
  const padding = MARKDOWN_CARD_PADDING
  const iconSize = 14
  const titleFontSize = 13
  const contentWidth = el.width - padding * 2
  const iconY = padding
  const titleY = iconY + iconSize + 10
  const titleHeight = estimateWrappedTextHeight(title, contentWidth, titleFontSize, {
    fontFamily: el.fontFamily,
    fontStyle: 'bold',
    lineHeight: 1,
  })
  const previewStartY = titleY + titleHeight + 8
  const truncated = isMarkdownTruncated(markdown)
  const footerY = el.height - padding - 12
  const previewMaxHeight = Math.max(0, footerY - previewStartY - (truncated ? PREVIEW_FOOTER_RESERVE : 6))
  const g = new Konva.Group({ x, y, opacity: el.opacity, rotation: el.rotation })
  g.add(
    new Konva.Rect({
      width: el.width,
      height: el.height,
      fill: el.backgroundColor,
      cornerRadius: MARKDOWN_CARD_RADIUS,
      stroke: '#E5E7EB',
      strokeWidth: 1,
    }),
  )
  g.add(
    new Konva.Text({
      x: padding,
      y: titleY,
      width: contentWidth,
      text: title,
      fontFamily: el.fontFamily,
      fontSize: titleFontSize,
      fontStyle: 'bold',
      fill: el.textColor,
      wrap: 'word',
    }),
  )
  const previewGroup = new Konva.Group({
    clipX: padding,
    clipY: previewStartY,
    clipWidth: contentWidth,
    clipHeight: previewMaxHeight,
  })
  const previewItems = layoutMarkdownPreviewBlocks(
    previewBlocks,
    padding,
    previewStartY,
    contentWidth,
    el.fontFamily,
    previewMaxHeight,
  )
  addMarkdownPreviewItemsToGroup(previewGroup, Konva, previewItems)
  g.add(previewGroup)
  layer.add(g)
}

export async function exportFrameToPng(
  frame: FrameElement,
  elements: CanvasElement[],
  markdownByContentId: Map<string, string>,
): Promise<Blob> {
  const normalized = normalizeFrame(frame)
  const pad = EXPORT_EDGE_PADDING
  const hasNotch = Boolean(getFrameTitleNotchLayout(normalized))
  const topExtra = hasNotch ? FRAME_TITLE_FONT_SIZE + FRAME_TITLE_FLOAT_GAP : 0
  const width = frame.width + pad * 2
  const height = frame.height + pad * 2 + topExtra

  const container = document.createElement('div')
  const stage = new Konva.Stage({ container, width, height })
  const layer = new Konva.Layer()
  stage.add(layer)

  layer.add(
    new Konva.Rect({
      x: pad,
      y: pad + topExtra,
      width: frame.width,
      height: frame.height,
      fill: frame.backgroundColor,
      cornerRadius: frame.radius,
      opacity: frame.opacity,
    }),
  )

  drawTitleNotch(layer, normalized, pad, topExtra)

  for (let i = 0; i < (normalized.childIds ?? []).length; i++) {
    const childId = normalized.childIds[i]!
    const child = elements.find((el) => el.id === childId)
    if (!child) continue
    const { x, y } = relPos(normalized, child, pad, topExtra)

    switch (child.type) {
      case 'image':
        await drawImage(layer, child, x, y)
        break
      case 'text':
        drawText(layer, child, x, y)
        break
      case 'shape':
        drawShape(layer, child, x, y)
        break
      case 'palette':
        drawPalette(layer, child, x, y)
        break
      case 'markdown':
        drawMarkdown(layer, child, markdownByContentId.get(child.contentId) ?? '', x, y)
        break
      default:
        break
    }

    drawBadge(layer, x, y, getChildOrderIndex(childId, normalized) + 1)
  }

  layer.draw()

  const dataUrl = stage.toDataURL({ pixelRatio: 2 })
  stage.destroy()

  const res = await fetch(dataUrl)
  return res.blob()
}
