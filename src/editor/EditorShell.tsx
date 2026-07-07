import { useEffect, useRef } from 'react'
import { PanelRightClose } from 'lucide-react'
import { AnimatedSidebarSlot } from './AnimatedSidebarSlot'
import { LeftSidebar } from './LeftSidebar'
import { TopBar } from './TopBar'
import { CanvasStage } from './CanvasStage'
import { FloatingToolbar } from './FloatingToolbar'
import { RightInspector } from './RightInspector'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useCanvasLoader } from './hooks/useCanvasLoader'
import { useEditorStore } from './state/editorStore'
import { MarkdownDetailModal } from './components/MarkdownDetailModal'

export function EditorShell() {
  useKeyboardShortcuts()
  const { loadCanvas } = useCanvasLoader()
  const loadedRef = useRef(false)
  const leftSidebarOpen = useEditorStore((s) => s.leftSidebarOpen)
  const rightSidebarOpen = useEditorStore((s) => s.rightSidebarOpen)
  const setRightSidebarOpen = useEditorStore((s) => s.setRightSidebarOpen)

  useEffect(() => {
    if (loadedRef.current) return
    const id = useEditorStore.getState().activeCanvasId
    if (id) {
      loadedRef.current = true
      void loadCanvas(id)
    }
  }, [loadCanvas])

  useEffect(() => {
    const handleBeforeUnload = () => {
      const { activeCanvas, elements } = useEditorStore.getState()
      if (activeCanvas) {
        localStorage.setItem(`pending-save-${activeCanvas.id}`, JSON.stringify(elements))
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  return (
    <div className="flex h-full flex-col">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <AnimatedSidebarSlot side="left" open={leftSidebarOpen} width={260}>
          <LeftSidebar />
        </AnimatedSidebarSlot>
        <div className="relative flex min-w-0 flex-1 flex-col">
          <FloatingToolbar />
          <CanvasStage />
        </div>
        <AnimatedSidebarSlot side="right" open={rightSidebarOpen} width={320}>
          <aside className="flex h-full w-[320px] flex-col bg-white">
            <div className="flex justify-end border-b border-panel-border px-2 py-2">
              <button
                type="button"
                title="Close inspector"
                aria-label="Close inspector sidebar"
                onClick={() => setRightSidebarOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-gray-100 hover:text-text-primary"
              >
                <PanelRightClose className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <RightInspector />
            </div>
          </aside>
        </AnimatedSidebarSlot>
      </div>
      <MarkdownDetailModal />
    </div>
  )
}
