import { useCallback, useRef } from 'react'
import { readMarkdownContent, updateMarkdownContent } from '../../db/mediaRepo'
import { useEditorStore } from '../state/editorStore'

export function useMarkdownContent(contentId: string): [string, (text: string) => void] {
  const cacheVersion = useEditorStore((s) => s.markdownCacheVersion)
  const setMarkdownContent = useEditorStore((s) => s.setMarkdownContent)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const content = useEditorStore.getState().getMarkdownContent(contentId) ?? ''
  void cacheVersion

  const setContent = useCallback(
    (text: string) => {
      setMarkdownContent(contentId, text)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        void updateMarkdownContent(contentId, text)
      }, 500)
    },
    [contentId, setMarkdownContent],
  )

  return [content, setContent]
}

export async function loadMarkdownContentsForElements(
  elements: Array<{ type: string; contentId?: string }>,
): Promise<Array<{ contentId: string; text: string }>> {
  const contentIds = elements
    .filter((el): el is { type: 'markdown'; contentId: string } => el.type === 'markdown' && !!el.contentId)
    .map((el) => el.contentId)

  const unique = [...new Set(contentIds)]
  const entries: Array<{ contentId: string; text: string }> = []
  for (const contentId of unique) {
    try {
      const text = await readMarkdownContent(contentId)
      entries.push({ contentId, text })
    } catch {
      entries.push({ contentId, text: '' })
    }
  }
  return entries
}
