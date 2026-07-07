import { useEffect, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { FileText, X } from 'lucide-react'
import type { MarkdownElement } from '../../db/schema'
import { MARKDOWN_CARD_PADDING, MARKDOWN_CARD_RADIUS } from '../../db/schema'
import { useEditorStore } from '../state/editorStore'
import { MarkdownEditor } from './MarkdownEditor'
import { MarkdownPreview } from './MarkdownPreview'
import { useMarkdownContent } from '../hooks/useMarkdownContent'
import { extractMarkdownTitle, formatLastEdited, markdownCharCount } from '../../utils/markdown'

type Tab = 'preview' | 'edit'

export function MarkdownDetailModal() {
  const openMarkdownId = useEditorStore((s) => s.openMarkdownId)
  const setOpenMarkdownId = useEditorStore((s) => s.setOpenMarkdownId)
  const elements = useEditorStore((s) => s.elements)
  const [tab, setTab] = useState<Tab>('preview')

  const element = elements.find(
    (el): el is MarkdownElement => el.id === openMarkdownId && el.type === 'markdown',
  )
  const [markdown, setMarkdown] = useMarkdownContent(element?.contentId ?? '')

  useEffect(() => {
    if (openMarkdownId && !element) setOpenMarkdownId(null)
  }, [openMarkdownId, element, setOpenMarkdownId])

  const handleOpenChange = (open: boolean) => {
    if (!open) setOpenMarkdownId(null)
  }

  if (!element) return null

  const title = extractMarkdownTitle(markdown)
  const charCount = markdownCharCount(markdown)

  return (
    <Dialog.Root open={openMarkdownId !== null} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[85vh] w-[min(640px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-panel-border bg-white shadow-xl outline-none">
          <div className="flex items-start justify-between border-b border-panel-border px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Dialog.Title className="text-lg font-semibold text-text-primary">{title}</Dialog.Title>
                <p className="mt-0.5 text-xs text-text-secondary">
                  Last edited {formatLastEdited(element.updatedAt)}
                </p>
              </div>
            </div>
            <Dialog.Close
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-gray-100"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <div className="flex border-b border-panel-border px-5">
            <div className="flex gap-4">
              {(['preview', 'edit'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`border-b-2 py-3 text-sm font-medium capitalize transition-colors ${
                    tab === t
                      ? 'border-primary text-primary'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            {tab === 'edit' ? (
              <MarkdownEditor
                value={markdown}
                onChange={setMarkdown}
                minLines={14}
              />
            ) : (
              <MarkdownPreview
                markdown={markdown}
                fontFamily={element.fontFamily}
                textColor={element.textColor}
                backgroundColor={element.backgroundColor}
                padding={MARKDOWN_CARD_PADDING}
                radius={MARKDOWN_CARD_RADIUS}
                className="min-h-[200px] border border-panel-border"
              />
            )}
          </div>

          <div className="flex items-center justify-between border-t border-panel-border px-5 py-3 text-xs text-text-secondary">
            <span>Markdown</span>
            <span>{charCount}+ characters • Full content</span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
