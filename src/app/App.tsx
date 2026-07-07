import { useEffect, useState } from 'react'
import { EditorShell } from '../editor/EditorShell'
import { ensureActiveCanvas } from '../db/seed'
import { useEditorStore } from '../editor/state/editorStore'

export function App() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    void ensureActiveCanvas().then((activeCanvasId) => {
      if (activeCanvasId) {
        useEditorStore.getState().setActiveCanvasId(activeCanvasId)
        const projectId = localStorage.getItem('activeProjectId')
        if (projectId) useEditorStore.getState().setActiveProject(projectId)
      }
      setReady(true)
    })
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
