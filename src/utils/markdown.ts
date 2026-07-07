const PREVIEW_CHAR_LIMIT = 200
const FENCE_OPEN_RE = /^```([\w-]*)$/
const FENCE_CLOSE_RE = /^```$/

export type CanvasPreviewBlock =
  | { kind: 'text'; lines: string[] }
  | { kind: 'code'; language: string; lines: string[] }

export function extractMarkdownTitle(markdown: string): string {
  const heading = markdown.match(/^#\s+(.+)$/m)
  if (heading?.[1]) return heading[1].trim()
  const firstLine = markdown.split('\n').find((line) => line.trim().length > 0)
  return firstLine?.replace(/^#+\s*/, '').trim() || 'Untitled'
}

export function markdownToPlainText(markdown: string): string {
  return markdown
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[-*+]\s+/gm, '• ')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/[*_`~]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function getCanvasPreviewBody(markdown: string): string {
  return getCanvasPreviewBlocks(markdown, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY)
    .flatMap((block) => block.lines)
    .join('\n')
}

export function getCanvasPreviewBlocks(
  markdown: string,
  maxLines = 4,
  maxChars = PREVIEW_CHAR_LIMIT,
): CanvasPreviewBlock[] {
  const blocks: CanvasPreviewBlock[] = []
  const lines = markdown.split('\n')
  let charCount = 0
  let previewLineCount = 0
  let textBuffer: string[] = []

  const flushText = () => {
    if (textBuffer.length === 0) return
    blocks.push({ kind: 'text', lines: [...textBuffer] })
    textBuffer = []
  }

  const canAddMore = () => previewLineCount < maxLines && charCount < maxChars

  const addPreviewLine = (line: string): string | null => {
    if (!canAddMore()) return null
    const remaining = maxChars - charCount
    if (remaining <= 0) return null
    let out = line
    if (line.length > remaining) {
      out = `${line.slice(0, remaining).trimEnd()}…`
    }
    charCount += out.length
    previewLineCount += 1
    return out
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line || /^#{1,6}\s/.test(line)) continue

    const fenceOpen = line.match(FENCE_OPEN_RE)
    if (fenceOpen) {
      flushText()
      const language = fenceOpen[1] ?? ''
      const codeLines: string[] = []
      i += 1
      while (i < lines.length && !FENCE_CLOSE_RE.test(lines[i].trim())) {
        const added = addPreviewLine(lines[i].trimEnd())
        if (added === null) break
        codeLines.push(added)
        i += 1
      }
      if (codeLines.length > 0) {
        blocks.push({ kind: 'code', language, lines: codeLines })
      }
      continue
    }

    const previewLine = /^[-*+]\s+/.test(line)
      ? `• ${line.replace(/^[-*+]\s+/, '')}`
      : line
    const added = addPreviewLine(previewLine)
    if (added === null) break
    textBuffer.push(added)
  }

  flushText()
  return blocks
}

export function truncateMarkdownPreview(markdown: string, max = PREVIEW_CHAR_LIMIT): string {
  const plain = getCanvasPreviewBody(markdown)
  if (plain.length <= max) return plain
  return `${plain.slice(0, max).trimEnd()}…`
}

export function getCanvasPreviewLines(markdown: string, maxLines = 4): string[] {
  return getCanvasPreviewBlocks(markdown, maxLines).flatMap((block) => block.lines)
}

export function markdownCharCount(markdown: string): number {
  return markdown.length
}

export function isMarkdownTruncated(markdown: string, max = PREVIEW_CHAR_LIMIT): boolean {
  return getCanvasPreviewBody(markdown).length > max
}

export function formatLastEdited(updatedAt: number): string {
  return new Date(updatedAt).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const MARKDOWN_PATTERNS = [
  /^#{1,6}\s/m,
  /^\s*[-*+]\s/m,
  /^\s*\d+\.\s/m,
  /^```/m,
  /\[[^\]]+\]\([^)]+\)/,
  /\*\*[^*\n]+\*\*/,
  /^>\s/m,
  /^\|.+\|/m,
]

export function looksLikeMarkdown(text: string): boolean {
  const trimmed = text.trim()
  if (!trimmed) return false
  return MARKDOWN_PATTERNS.some((pattern) => pattern.test(trimmed))
}

export function isMarkdownFilename(name: string): boolean {
  return name.toLowerCase().endsWith('.md') || name.toLowerCase().endsWith('.markdown')
}
