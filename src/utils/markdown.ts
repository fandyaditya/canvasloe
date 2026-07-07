const PREVIEW_CHAR_LIMIT = 200

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
  const parts: string[] = []
  for (const raw of markdown.split('\n')) {
    const line = raw.trim()
    if (!line || /^#{1,6}\s/.test(line)) continue
    parts.push(/^[-*+]\s+/.test(line) ? line.replace(/^[-*+]\s+/, '') : line)
  }
  return parts.join('\n')
}

export function truncateMarkdownPreview(markdown: string, max = PREVIEW_CHAR_LIMIT): string {
  const plain = getCanvasPreviewBody(markdown)
  if (plain.length <= max) return plain
  return `${plain.slice(0, max).trimEnd()}…`
}

export function getCanvasPreviewLines(markdown: string, maxLines = 4): string[] {
  const result: string[] = []
  let charCount = 0

  for (const raw of markdown.split('\n')) {
    const line = raw.trim()
    if (!line || /^#{1,6}\s/.test(line)) continue

    const previewLine = /^[-*+]\s+/.test(line)
      ? `• ${line.replace(/^[-*+]\s+/, '')}`
      : line

    if (result.length >= maxLines) break

    const remaining = PREVIEW_CHAR_LIMIT - charCount
    if (remaining <= 0) break

    if (previewLine.length <= remaining) {
      result.push(previewLine)
      charCount += previewLine.length
    } else {
      result.push(`${previewLine.slice(0, remaining).trimEnd()}…`)
      break
    }
  }

  return result
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
