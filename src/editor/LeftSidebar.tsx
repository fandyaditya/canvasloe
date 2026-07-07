import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  ChevronDown,
  ChevronRight,
  Folder,
  HardDrive,
  LayoutGrid,
  PanelLeftClose,
  Plus,
  Settings,
} from 'lucide-react'
import { db } from '../db/db'
import { createProject, updateProject } from '../db/projectRepo'
import { createCanvas } from '../db/canvasRepo'
import { useEditorStore } from './state/editorStore'
import { useCanvasLoader } from './hooks/useCanvasLoader'
import { formatBytes, getStorageUsage } from '../utils/image'
import { InlineEditable } from './components/InlineEditable'

export function LeftSidebar() {
  const projects = useLiveQuery(() => db.projects.orderBy('createdAt').toArray(), [])
  const activeCanvasId = useEditorStore((s) => s.activeCanvasId)
  const activeProjectId = useEditorStore((s) => s.activeProjectId)
  const expandedProjects = useEditorStore((s) => s.expandedProjects)
  const toggleProjectExpanded = useEditorStore((s) => s.toggleProjectExpanded)
  const setLeftSidebarOpen = useEditorStore((s) => s.setLeftSidebarOpen)
  const { loadCanvas } = useCanvasLoader()
  const [storage, setStorage] = useState({ used: 0, quota: 1024 * 1024 * 1024 })

  useEffect(() => {
    void getStorageUsage().then(setStorage)
    const interval = setInterval(() => void getStorageUsage().then(setStorage), 10000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!activeProjectId) return
    if (!expandedProjects.has(activeProjectId)) {
      toggleProjectExpanded(activeProjectId)
    }
  }, [activeProjectId, expandedProjects, toggleProjectExpanded])

  const handleCreateProject = async () => {
    const name = prompt('Project name:', 'New Project')
    if (!name) return
    const project = await createProject(name)
    toggleProjectExpanded(project.id)
  }

  const handleCreateCanvas = async (projectId: string) => {
    const canvas = await createCanvas(projectId, 'Untitled Canvas')
    await loadCanvas(canvas.id)
  }

  const usagePercent = storage.quota > 0 ? (storage.used / storage.quota) * 100 : 0

  return (
    <aside className="flex h-full w-[260px] shrink-0 flex-col bg-white">
      <div className="flex items-center justify-between border-b border-panel-border px-4 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <LayoutGrid className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-semibold">Moodboard</span>
        </div>
        <button
          type="button"
          title="Close sidebar"
          aria-label="Close projects sidebar"
          onClick={() => setLeftSidebarOpen(false)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-gray-100 hover:text-text-primary"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        <div className="mb-2 flex items-center justify-between px-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Projects</span>
          <button
            type="button"
            onClick={() => void handleCreateProject()}
            className="flex h-6 w-6 items-center justify-center rounded-md text-text-secondary hover:bg-gray-100 hover:text-primary"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-1">
          {projects === undefined ? (
            <p className="px-2 text-sm text-text-secondary">Loading...</p>
          ) : projects.length === 0 ? (
            <p className="px-2 text-sm text-text-secondary">No projects yet</p>
          ) : (
            projects.map((project) => {
              const expanded = expandedProjects.has(project.id)
              return (
                <ProjectItem
                  key={project.id}
                  project={project}
                  expanded={expanded}
                  activeCanvasId={activeCanvasId}
                  onToggle={() => toggleProjectExpanded(project.id)}
                  onCreateCanvas={() => void handleCreateCanvas(project.id)}
                  onSelectCanvas={(id) => void loadCanvas(id)}
                  onRenameProject={(name) => void updateProject(project.id, { name })}
                />
              )
            })
          )}
        </div>
      </div>

      <div className="border-t border-panel-border p-3">
        <div className="mb-3 rounded-xl border border-panel-border bg-gray-50 p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-text-secondary">
            <HardDrive className="h-3.5 w-3.5" />
            Local Storage
          </div>
          <div className="mb-1.5 h-1.5 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            />
          </div>
          <div className="text-xs text-text-secondary">{formatBytes(storage.used)} used</div>
        </div>
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-text-secondary hover:bg-gray-50"
        >
          <Settings className="h-4 w-4" />
          Settings
        </button>
      </div>
    </aside>
  )
}

function ProjectItem({
  project,
  expanded,
  activeCanvasId,
  onToggle,
  onCreateCanvas,
  onSelectCanvas,
  onRenameProject,
}: {
  project: { id: string; name: string }
  expanded: boolean
  activeCanvasId: string | null
  onToggle: () => void
  onCreateCanvas: () => void
  onSelectCanvas: (id: string) => void
  onRenameProject: (name: string) => void
}) {
  const canvases = useLiveQuery(
    () => db.canvases.where('projectId').equals(project.id).sortBy('createdAt'),
    [project.id],
  )

  const canvasCount = canvases?.length ?? 0

  return (
    <div>
      <div className="group flex items-center gap-1 rounded-lg px-1 py-1 hover:bg-gray-50">
        <button type="button" onClick={onToggle} className="flex h-6 w-6 items-center justify-center text-text-secondary">
          {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </button>
        <Folder className="h-4 w-4 shrink-0 text-text-secondary" />
        <InlineEditable
          value={project.name}
          onSave={onRenameProject}
          className="flex-1 truncate text-sm font-medium"
          inputClassName="min-w-0 flex-1 rounded border border-panel-border px-1 py-0.5 text-sm font-medium outline-none focus:border-primary"
        />
        {!expanded && <span className="text-xs text-text-secondary">{canvasCount} canvases</span>}
        <button
          type="button"
          onClick={onCreateCanvas}
          className="flex h-6 w-6 items-center justify-center rounded-md opacity-0 text-text-secondary hover:bg-gray-100 hover:text-primary group-hover:opacity-100"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {expanded && (
        <div className="ml-4 space-y-0.5 border-l border-panel-border pl-2">
          {canvases === undefined ? null : canvases.length === 0 ? (
            <p className="px-2 py-1 text-xs text-text-secondary">No canvases</p>
          ) : (
            canvases.map((canvas) => {
              const active = canvas.id === activeCanvasId
              return (
                <button
                  key={canvas.id}
                  type="button"
                  onClick={() => onSelectCanvas(canvas.id)}
                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors ${
                    active
                      ? 'bg-primary/10 font-medium text-primary'
                      : 'text-text-secondary hover:bg-gray-50 hover:text-text-primary'
                  }`}
                >
                  {active && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                  <span className={`truncate ${active ? '' : 'ml-3.5'}`}>{canvas.name}</span>
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
