import { useEffect, useState } from 'react'
import { EditorShell } from '../editor/EditorShell'
import { ensureActiveCanvas } from '../db/seed'
import { migrateToOpfs } from '../db/migrateToOpfs'
import { purgeOrphanedOpfs } from '../db/mediaRepo'
import { useEditorStore } from '../editor/state/editorStore'

export function App() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    void (async () => {
      await migrateToOpfs()
      const orphaned = await purgeOrphanedOpfs()
      if (orphaned.removedFiles > 0) {
        console.info(
          `[OPFS] removed ${orphaned.removedFiles} orphaned files (${orphaned.freedBytes} bytes)`,
        )
      }
      const activeCanvasId = await ensureActiveCanvas()
      if (activeCanvasId) {
        useEditorStore.getState().setActiveCanvasId(activeCanvasId)
        const projectId = localStorage.getItem('activeProjectId')
        if (projectId) useEditorStore.getState().setActiveProject(projectId)
      }
      setReady(true)
    })()
  }, [])

  if (!ready) {
    return (
      <div className="flex h-full items-center justify-center text-text-secondary">
        Loading Moodboard...
      </div>
    )
  }

  return <EditorShell />
}
