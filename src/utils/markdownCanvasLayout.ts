import type { CanvasPreviewBlock } from './markdown'

export const PREVIEW_TEXT_FONT_SIZE = 10
export const PREVIEW_TEXT_LINE_HEIGHT = 1.5
export const PREVIEW_TEXT_COLOR = '#6B7280'
export const CODE_FONT_SIZE = 9
export const CODE_LINE_HEIGHT = 1.45
export const CODE_FONT_FAMILY = 'ui-monospace, SFMono-Regular, Menlo, monospace'
export const CODE_BG = '#F3F4F6'
export const CODE_TEXT = '#374151'
export const CODE_LABEL_SIZE = 8
export const CODE_LABEL_COLOR = '#9CA3AF'
export const CODE_BLOCK_PADDING = 6
export const CODE_BLOCK_RADIUS = 4
export const CODE_BLOCK_GAP = 6
export const CODE_LABEL_GAP = 2
export const TEXT_BLOCK_GAP = 4
export const PREVIEW_FOOTER_RESERVE = 14

export type MarkdownPreviewLayoutItem =
  | { type: 'text'; x: number; y: number; width: number; height: number; text: string; fontFamily: string }
  | { type: 'code-background'; x: number; y: number; width: number; height: number }
  | { type: 'code-label'; x: number; y: number; text: string }
  | { type: 'code-text'; x: number; y: number; width: number; height: number; text: string }

function measureTextBlockHeight(lineCount: number): number {
  if (lineCount <= 0) return 0
  return lineCount * PREVIEW_TEXT_FONT_SIZE * PREVIEW_TEXT_LINE_HEIGHT + TEXT_BLOCK_GAP
}

function measureCodeBlockHeight(lineCount: number, hasLanguage: boolean): number {
  if (lineCount <= 0) return 0
  const labelHeight = hasLanguage ? CODE_LABEL_SIZE + CODE_LABEL_GAP : 0
  const codeTextHeight = lineCount * CODE_FONT_SIZE * CODE_LINE_HEIGHT
  return CODE_BLOCK_PADDING * 2 + labelHeight + codeTextHeight
}

function remainingHeight(cursorY: number, startY: number, maxHeight?: number): number {
  if (maxHeight === undefined) return Number.POSITIVE_INFINITY
  return Math.max(0, startY + maxHeight - cursorY)
}

function trimLinesToHeight(lineHeight: number, available: number, gap = 0): number {
  if (available <= gap) return 0
  return Math.max(0, Math.floor((available - gap) / lineHeight))
}

export function layoutMarkdownPreviewBlocks(
  blocks: CanvasPreviewBlock[],
  x: number,
  y: number,
  width: number,
  fontFamily: string,
  maxHeight?: number,
): MarkdownPreviewLayoutItem[] {
  const items: MarkdownPreviewLayoutItem[] = []
  let cursorY = y

  for (const block of blocks) {
    const available = remainingHeight(cursorY, y, maxHeight)
    if (available <= 0) break

    if (block.kind === 'text') {
      const lineHeight = PREVIEW_TEXT_FONT_SIZE * PREVIEW_TEXT_LINE_HEIGHT
      const maxLines = Math.min(
        block.lines.length,
        trimLinesToHeight(lineHeight, available, TEXT_BLOCK_GAP),
      )
      if (maxLines <= 0) break

      const lines = block.lines.slice(0, maxLines)
      const textHeight = maxLines * lineHeight
      items.push({
        type: 'text',
        x,
        y: cursorY,
        width,
        height: textHeight,
        text: lines.join('\n'),
        fontFamily,
      })
      cursorY += measureTextBlockHeight(maxLines)
      continue
    }

    const hasLanguage = Boolean(block.language)
    const labelHeight = hasLanguage ? CODE_LABEL_SIZE + CODE_LABEL_GAP : 0
    const lineHeight = CODE_FONT_SIZE * CODE_LINE_HEIGHT
    const chrome = CODE_BLOCK_PADDING * 2 + labelHeight
    const maxCodeLines = Math.min(
      block.lines.length,
      trimLinesToHeight(lineHeight, available - CODE_BLOCK_GAP, chrome),
    )
    if (maxCodeLines <= 0) break

    const lines = block.lines.slice(0, maxCodeLines)
    const codeTextHeight = maxCodeLines * lineHeight
    const blockHeight = measureCodeBlockHeight(maxCodeLines, hasLanguage)

    items.push({ type: 'code-background', x, y: cursorY, width, height: blockHeight })
    let innerY = cursorY + CODE_BLOCK_PADDING
    if (hasLanguage) {
      items.push({ type: 'code-label', x: x + CODE_BLOCK_PADDING, y: innerY, text: block.language })
      innerY += labelHeight
    }
    items.push({
      type: 'code-text',
      x: x + CODE_BLOCK_PADDING,
      y: innerY,
      width: width - CODE_BLOCK_PADDING * 2,
      height: codeTextHeight,
      text: lines.join('\n'),
    })
    cursorY += blockHeight + CODE_BLOCK_GAP
  }

  return items
}
