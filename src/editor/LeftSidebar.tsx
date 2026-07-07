import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  ChevronDown,
  ChevronRight,
  Folder,
  HardDrive,
  LayoutGrid,
  PanelLeft,
  Plus,
  Settings,
  Trash2,
} from 'lucide-react'
import { db } from '../db/db'
import { createProject, deleteProject, updateProject } from '../db/projectRepo'
import { createCanvas, deleteCanvas, updateCanvas } from '../db/canvasRepo'
import { useEditorStore } from './state/editorStore'
import { useCanvasLoader } from './hooks/useCanvasLoader'
import {
  formatBytes,
  getStorageBreakdown,
  subscribeStorageUsage,
  type StorageBreakdown,
} from '../utils/storageUsage'
import { confirmDelete, promptInput } from '../utils/confirmDelete'
import { InlineEditable } from './components/InlineEditable'

export function LeftSidebar() {
  const projects = useLiveQuery(() => db.projects.orderBy('createdAt').toArray(), [])
  const activeCanvasId = useEditorStore((s) => s.activeCanvasId)
  const activeProjectId = useEditorStore((s) => s.activeProjectId)
  const expandedProjects = useEditorStore((s) => s.expandedProjects)
  const setActiveProject = useEditorStore((s) => s.setActiveProject)
  const toggleProjectExpanded = useEditorStore((s) => s.toggleProjectExpanded)
  const setLeftSidebarOpen = useEditorStore((s) => s.setLeftSidebarOpen)
  const { loadCanvas } = useCanvasLoader()
  const [storage, setStorage] = useState<StorageBreakdown | null>(null)

  useEffect(() => {
    const refresh = () => {
      void getStorageBreakdown().then(setStorage)
    }
    refresh()
    return subscribeStorageUsage(refresh)
  }, [])

  useEffect(() => {
    if (!activeProjectId) return
    if (!expandedProjects.has(activeProjectId)) {
      toggleProjectExpanded(activeProjectId)
    }
  }, [activeProjectId, expandedProjects, toggleProjectExpanded])

  const handleCreateProject = async () => {
    const name = await promptInput({
      title: 'New project',
      message: 'Project name',
      defaultValue: 'New Project',
      confirmLabel: 'Create',
    })
    if (!name) return
    const project = await createProject(name)
    toggleProjectExpanded(project.id)
  }

  const handleCreateCanvas = async (projectId: string) => {
    const canvas = await createCanvas(projectId, 'Untitled Canvas')
    await loadCanvas(canvas.id)
  }

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (
      !(await confirmDelete(
        `Are you sure you want to delete "${projectName}"?\n\nAll canvases and files in this project will be permanently removed.`,
      ))
    ) {
      return
    }

    const state = useEditorStore.getState()
    const wasActiveProject = state.activeProjectId === projectId

    await deleteProject(projectId)

    if (!wasActiveProject) return

    const nextCanvas = await db.canvases.orderBy('createdAt').first()
    if (nextCanvas) {
      await loadCanvas(nextCanvas.id)
      return
    }

    state.setActiveCanvas(null)
    state.setActiveCanvasId(null)
    state.setActiveProject(null)
    state.setElements([])
    state.clearSelection()
    state.clearMarkdownCache()
  }

  const handleRenameCanvas = async (canvasId: string, name: string) => {
    await updateCanvas(canvasId, { name })
    const state = useEditorStore.getState()
    if (state.activeCanvas?.id === canvasId) {
      state.setActiveCanvas({ ...state.activeCanvas, name })
    }
  }

  const handleDeleteCanvas = async (canvasId: string, canvasName: string, projectId: string) => {
    if (
      !(await confirmDelete(
        `Are you sure you want to delete "${canvasName}"?\n\nAll elements and files on this canvas will be permanently removed.`,
      ))
    ) {
      return
    }

    const state = useEditorStore.getState()
    const wasActive = state.activeCanvasId === canvasId

    await deleteCanvas(canvasId)

    if (!wasActive) return

    const siblings = await db.canvases.where('projectId').equals(projectId).sortBy('createdAt')
    if (siblings.length > 0) {
      await loadCanvas(siblings[0].id)
      return
    }

    const fallbackCanvas = await db.canvases.orderBy('createdAt').first()
    if (fallbackCanvas) {
      await loadCanvas(fallbackCanvas.id)
      return
    }

    state.setActiveCanvas(null)
    state.setActiveCanvasId(null)
    state.setActiveProject(null)
    state.setElements([])
    state.clearSelection()
    state.clearMarkdownCache()
  }

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
          <PanelLeft className="h-4 w-4" />
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
                  onSelectProject={() => {
                    setActiveProject(project.id)
                    if (!expanded) toggleProjectExpanded(project.id)
                  }}
                  onRenameProject={(name) => void updateProject(project.id, { name })}
                  onRenameCanvas={(canvasId, name) => void handleRenameCanvas(canvasId, name)}
                  onDeleteProject={() => void handleDeleteProject(project.id, project.name)}
                  onDeleteCanvas={(canvasId, canvasName) =>
                    void handleDeleteCanvas(canvasId, canvasName, project.id)
                  }
                />
              )
            })
          )}
        </div>
      </div>

      <div className="border-t border-panel-border p-3">
        <div className="mb-3 rounded-xl border border-panel-border bg-gray-50 p-3">
          <div className="mb-1 flex items-center gap-2 text-xs font-medium text-text-secondary">
            <HardDrive className="h-3.5 w-3.5" />
            Browser Storage
          </div>
          <div className="text-xs text-text-secondary">
            {storage ? `${formatBytes(storage.total)} used` : 'Calculating…'}
          </div>
          {storage && (
            <dl className="mt-2 space-y-0.5 text-[11px] text-text-secondary">
              <div className="flex justify-between gap-2">
                <dt>IndexedDB</dt>
                <dd>{formatBytes(storage.indexedDb)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>OPFS</dt>
                <dd>{formatBytes(storage.opfs)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>localStorage</dt>
                <dd>{formatBytes(storage.localStorage)}</dd>
              </div>
            </dl>
          )}
        </div>
        {/* OPFS in-app browser — disabled; re-enable with onClick={() => setOpfsBrowserOpen(true)} */}
        {/* <button
          type="button"
          onClick={() => setOpfsBrowserOpen(true)}
          className="mb-3 w-full rounded-xl border border-panel-border bg-gray-50 p-3 text-left transition-colors hover:border-primary/30 hover:bg-primary/5"
        >
          ...
        </button> */}
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
  onSelectProject,
  onRenameProject,
  onRenameCanvas,
  onDeleteProject,
  onDeleteCanvas,
}: {
  project: { id: string; name: string }
  expanded: boolean
  activeCanvasId: string | null
  onToggle: () => void
  onCreateCanvas: () => void
  onSelectCanvas: (id: string) => void
  onSelectProject: () => void
  onRenameProject: (name: string) => void
  onRenameCanvas: (canvasId: string, name: string) => void
  onDeleteProject: () => void
  onDeleteCanvas: (canvasId: string, canvasName: string) => void
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
          openOn="doubleClick"
          onActivate={onSelectProject}
          placeholder="Untitled Project"
          className="flex-1 truncate text-sm font-medium"
          inputClassName="min-w-0 flex-1 rounded border border-panel-border px-1 py-0.5 text-sm font-medium outline-none focus:border-primary"
        />
        {!expanded && <span className="text-xs text-text-secondary">{canvasCount} canvases</span>}
        <button
          type="button"
          onClick={onCreateCanvas}
          title="New canvas"
          className="flex h-6 w-6 items-center justify-center rounded-md opacity-0 text-text-secondary hover:bg-gray-100 hover:text-primary group-hover:opacity-100"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onDeleteProject()
          }}
          title="Delete project"
          className="flex h-6 w-6 items-center justify-center rounded-md opacity-0 text-text-secondary hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
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
                <div
                  key={canvas.id}
                  className={`group/canvas flex items-center gap-1 rounded-lg pr-1 ${
                    active ? 'bg-primary/10' : 'hover:bg-gray-50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectCanvas(canvas.id)}
                    className={`flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left text-sm transition-colors ${
                      active ? 'font-medium text-primary' : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {active && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                    <InlineEditable
                      value={canvas.name}
                      onSave={(name) => onRenameCanvas(canvas.id, name)}
                      openOn="doubleClick"
                      placeholder="Untitled Canvas"
                      className={`min-w-0 flex-1 truncate ${active ? '' : 'ml-3.5'}`}
                      inputClassName="min-w-0 flex-1 rounded border border-panel-border px-1 py-0.5 text-sm outline-none focus:border-primary"
                    />
                  </button>
                  <button
                    type="button"
                    title="Delete canvas"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteCanvas(canvas.id, canvas.name)
                    }}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-text-secondary opacity-0 hover:bg-red-50 hover:text-red-500 group-hover/canvas:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
