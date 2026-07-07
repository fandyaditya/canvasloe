import { useCallback, useEffect, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { ChevronRight, Download, File, FileText, Folder, Image as ImageIcon, Video, X } from 'lucide-react'
import { listDirectory, readFile, readText } from '../../storage/opfs'
import type { OpfsEntry } from '../../storage/opfs'
import { downloadBlob, downloadText } from '../../utils/download'
import { useEditorStore } from '../state/editorStore'
import { isOpfsSupported } from '../../storage/opfs'

function kindIcon(name: string, kind: OpfsEntry['kind']) {
  if (kind === 'directory') return <Folder className="h-4 w-4 text-amber-500" />
  if (name.endsWith('.md')) return <FileText className="h-4 w-4 text-blue-500" />
  if (/\.(mp4|webm|mov)$/i.test(name)) return <Video className="h-4 w-4 text-purple-500" />
  if (/\.(png|jpe?g|gif|webp|svg)$/i.test(name)) return <ImageIcon className="h-4 w-4 text-green-500" />
  return <File className="h-4 w-4 text-text-secondary" />
}

export function OpfsBrowserPanel() {
  const open = useEditorStore((s) => s.opfsBrowserOpen)
  const setOpfsBrowserOpen = useEditorStore((s) => s.setOpfsBrowserOpen)
  const [currentPath, setCurrentPath] = useState('')
  const [entries, setEntries] = useState<OpfsEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadPath = useCallback(async (path: string) => {
    if (!isOpfsSupported()) {
      setError('OPFS is not supported in this browser.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const list = await listDirectory(path)
      setEntries(list)
      setCurrentPath(path)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read storage')
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) void loadPath('')
  }, [open, loadPath])

  const breadcrumbs = currentPath ? currentPath.split('/') : []

  const navigateUp = () => {
    if (!currentPath) return
    const parts = currentPath.split('/')
    parts.pop()
    void loadPath(parts.join('/'))
  }

  const handleDownload = async (entry: OpfsEntry) => {
    if (entry.kind !== 'file') return
    try {
      if (entry.name.endsWith('.md')) {
        const text = await readText(entry.path)
        downloadText(text, entry.name, 'text/markdown')
      } else {
        const blob = await readFile(entry.path)
        downloadBlob(blob, entry.name)
      }
    } catch {
      setError(`Failed to download ${entry.name}`)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpfsBrowserOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[85vh] w-[min(720px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-panel-border bg-white shadow-xl outline-none">
          <div className="flex items-center justify-between border-b border-panel-border px-5 py-4">
            <div>
              <Dialog.Title className="text-lg font-semibold text-text-primary">Browser Storage</Dialog.Title>
              <Dialog.Description className="mt-0.5 text-xs text-text-secondary">
                OPFS media files for this app
              </Dialog.Description>
            </div>
            <Dialog.Close
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-gray-100"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <div className="flex items-center gap-1 border-b border-panel-border px-5 py-2 text-xs text-text-secondary">
            <button type="button" onClick={() => void loadPath('')} className="hover:text-primary">
              media
            </button>
            {breadcrumbs.map((part, index) => {
              const path = breadcrumbs.slice(0, index + 1).join('/')
              return (
                <span key={path} className="flex items-center gap-1">
                  <ChevronRight className="h-3 w-3" />
                  <button type="button" onClick={() => void loadPath(path)} className="hover:text-primary">
                    {part}
                  </button>
                </span>
              )
            })}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {error ? (
              <p className="px-2 py-4 text-sm text-red-500">{error}</p>
            ) : loading ? (
              <p className="px-2 py-4 text-sm text-text-secondary">Loading...</p>
            ) : entries.length === 0 ? (
              <p className="px-2 py-4 text-sm text-text-secondary">
                {currentPath ? 'This folder is empty.' : 'No media files yet.'}
              </p>
            ) : (
              <div className="space-y-1">
                {currentPath ? (
                  <button
                    type="button"
                    onClick={navigateUp}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-50"
                  >
                    <Folder className="h-4 w-4 text-text-secondary" />
                    <span>..</span>
                  </button>
                ) : null}
                {entries.map((entry) => (
                  <div
                    key={entry.path}
                    className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-gray-50"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (entry.kind === 'directory') void loadPath(entry.path)
                      }}
                      className="flex min-w-0 flex-1 items-center gap-3 px-1 py-1.5 text-left text-sm"
                    >
                      {kindIcon(entry.name, entry.kind)}
                      <span className="truncate">{entry.name}</span>
                      {entry.kind === 'directory' ? (
                        <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-text-secondary" />
                      ) : null}
                    </button>
                    {entry.kind === 'file' ? (
                      <button
                        type="button"
                        title="Download"
                        onClick={() => void handleDownload(entry)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-secondary hover:bg-gray-100 hover:text-primary"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-panel-border px-5 py-3 text-xs text-text-secondary">
            Files are stored in the browser&apos;s private Origin File System (OPFS). Web apps cannot
            open Finder, Explorer, or other system file managers for this location — use this browser
            to browse and download files.
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
