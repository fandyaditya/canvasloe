import { useEffect, useMemo, useRef, useState } from 'react'
import { Circle, Layer, Rect, Stage, Transformer } from 'react-konva'
import type Konva from 'konva'
import { useEditorStore } from './state/editorStore'
import { useHistoryStore } from './state/historyStore'
import { useAutosave } from './hooks/useAutosave'
import { useDropImage } from './hooks/useDropImage'
import { useCanvasWheelZoom } from './hooks/useCanvasWheelZoom'
import { useCanvasShiftKey } from './hooks/useCanvasShiftKey'
import { useShiftHandHold } from './hooks/useShiftHandHold'
import { createElement } from '../db/elementRepo'
import { createMarkdownMedia } from '../db/mediaRepo'
import { renderElement } from './components/CanvasElements'
import { TextEditOverlay } from './components/TextEditOverlay'
import { CanvasGestureCue } from './components/CanvasGestureCue'
import type { ArrowElement, CanvasElement, FrameElement, MarkdownElement, PaletteElement, ShapeElement, TextElement } from '../db/schema'
import { MARKDOWN_DEFAULT_CONTENT, MARKDOWN_DEFAULT_SIZE, MARKDOWN_CARD_PADDING, MARKDOWN_CARD_RADIUS, PALETTE_DEFAULT_COLORS, getPaletteDimensions, ARROW_HIT_STROKE_WIDTH, FRAME_MIN_WIDTH, FRAME_MIN_HEIGHT, FRAME_MAX_WIDTH, FRAME_MAX_HEIGHT, clampFrameSize, getFrameAspectRatio } from '../db/schema'
import { createEmptyFrameAt, addChildToFrame } from './frame/createFrame'
import { canBeFrameChild, findFrameAtPoint, getElementCenter, moveFrameChildren, scaleFrameChildren } from './frame/frameLayout'

type ShapePreview = {
  tool: 'rect' | 'circle'
  x: number
  y: number
  width: number
  height: number
}

type SelectionPreview = {
  x: number
  y: number
  width: number
  height: number
}

function rectsIntersect(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
}

export function CanvasStage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const transformerRef = useRef<Konva.Transformer>(null)
  const drawingRef = useRef<{ startX: number; startY: number } | null>(null)
  const selectionRef = useRef<{ startX: number; startY: number } | null>(null)
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 })
  const [shapePreview, setShapePreview] = useState<ShapePreview | null>(null)
  const [selectionPreview, setSelectionPreview] = useState<SelectionPreview | null>(null)
  const [editingTextId, setEditingTextId] = useState<string | null>(null)

  const activeCanvas = useEditorStore((s) => s.activeCanvas)
  const elements = useEditorStore((s) => s.elements)
  const selectedElementIds = useEditorStore((s) => s.selectedElementIds)
  const currentTool = useEditorStore((s) => s.currentTool)
  const zoom = useEditorStore((s) => s.zoom)
  const pan = useEditorStore((s) => s.pan)
  const isPanning = useEditorStore((s) => s.isPanning)
  const isShiftHandHold = useEditorStore((s) => s.isShiftHandHold)
  const isScrollPanHold = useEditorStore((s) => s.isScrollPanHold)
  const isEditingText = useEditorStore((s) => s.isEditingText)
  const setPan = useEditorStore((s) => s.setPan)
  const setIsPanning = useEditorStore((s) => s.setIsPanning)
  const selectElement = useEditorStore((s) => s.selectElement)
  const clearSelection = useEditorStore((s) => s.clearSelection)
  const setSelectedElementIds = useEditorStore((s) => s.setSelectedElementIds)
  const updateElementLocal = useEditorStore((s) => s.updateElementLocal)
  const setElements = useEditorStore((s) => s.setElements)
  const addElementLocal = useEditorStore((s) => s.addElementLocal)
  const defaultColor = useEditorStore((s) => s.defaultColor)
  const setOpenMarkdownId = useEditorStore((s) => s.setOpenMarkdownId)
  const setCurrentTool = useEditorStore((s) => s.setCurrentTool)
  const setRightSidebarOpen = useEditorStore((s) => s.setRightSidebarOpen)
  const setCanvasViewportSize = useEditorStore((s) => s.setCanvasViewportSize)

  const { debouncedSave } = useAutosave()
  const { handleDrop, handleDragOver } = useDropImage(containerRef)
  useCanvasWheelZoom(containerRef, activeCanvas != null)
  useCanvasShiftKey(activeCanvas != null)
  useShiftHandHold(containerRef)

  const selectedIds = useMemo(() => new Set(selectedElementIds), [selectedElementIds])

  const lockAspectRatio = useMemo(() => {
    if (selectedElementIds.length !== 1) return false
    const el = elements.find((e) => e.id === selectedElementIds[0])
    return el?.type === 'markdown' || el?.type === 'image' || el?.type === 'palette' || el?.type === 'frame'
  }, [selectedElementIds, elements])

  const frameSelected = useMemo(() => {
    if (selectedElementIds.length !== 1) return false
    const el = elements.find((e) => e.id === selectedElementIds[0])
    return el?.type === 'frame'
  }, [selectedElementIds, elements])

  useEffect(() => {
    const container = containerRef.current
    if (!container || !activeCanvas) return
    const update = () => {
      const width = container.clientWidth
      const height = container.clientHeight
      setStageSize({ width, height })
      setCanvasViewportSize({ width, height })
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(container)
    return () => observer.disconnect()
  }, [activeCanvas?.id])

  useEffect(() => {
    const tr = transformerRef.current
    const stage = stageRef.current
    if (!tr || !stage) return
    const nodes = selectedElementIds
      .filter((id) => id !== editingTextId)
      .map((id) => stage.findOne(`#${id}`))
      .filter((node): node is Konva.Node => node != null)
    tr.nodes(nodes)
    tr.getLayer()?.batchDraw()
  }, [selectedElementIds, editingTextId])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) setIsPanning(true)
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') setIsPanning(false)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [setIsPanning])

  useEffect(() => {
    if (currentTool !== 'rect' && currentTool !== 'circle') {
      drawingRef.current = null
      setShapePreview(null)
    }
    if (currentTool !== 'select') {
      selectionRef.current = null
      setSelectionPreview(null)
    }
  }, [currentTool])

  const commitElements = (newElements: CanvasElement[]) => {
    if (!activeCanvas) return
    setElements(newElements)
    useHistoryStore.getState().pushHistory(activeCanvas.id, newElements)
    debouncedSave(activeCanvas, newElements)
  }

  const commitChange = () => {
    if (!activeCanvas) return
    const newElements = useEditorStore.getState().elements
    useHistoryStore.getState().pushHistory(activeCanvas.id, newElements)
    debouncedSave(activeCanvas, newElements)
  }

  const handleElementChange = (id: string, updates: Partial<CanvasElement>) => {
    const el = elements.find((e) => e.id === id)
    if (!el) return

    const isDragEnd = updates.x !== undefined || updates.y !== undefined

    if (isDragEnd && canBeFrameChild(el)) {
      const dx = (updates.x ?? el.x) - el.x
      const dy = (updates.y ?? el.y) - el.y

      if (Math.hypot(dx, dy) > 3) {
        const nextEl = { ...el, ...updates } as CanvasElement
        const center = getElementCenter(nextEl)
        const targetFrame = findFrameAtPoint(center.x, center.y, elements)
        const currentFrame = elements.find(
          (f): f is FrameElement => f.type === 'frame' && f.childIds.includes(id),
        )

        if (targetFrame && targetFrame.id !== currentFrame?.id) {
          let next = elements.map((item) =>
            item.id === id ? nextEl : item,
          )
          next = addChildToFrame(next, targetFrame.id, id)
          commitElements(next)
          return
        }
      }
    }

    updateElementLocal(id, updates)
    commitChange()
  }

  const handleFrameDragEnd = (frameId: string, dx: number, dy: number) => {
    const frame = elements.find((el): el is FrameElement => el.id === frameId && el.type === 'frame')
    if (!frame || (dx === 0 && dy === 0)) return

    const updatedFrame: FrameElement = { ...frame, x: frame.x + dx, y: frame.y + dy }
    let next = elements.map((el) => (el.id === frameId ? updatedFrame : el))
    next = moveFrameChildren(updatedFrame, dx, dy, next)
    commitElements(next)
  }

  const handleFrameTransformEnd = (
    frameId: string,
    updates: Partial<FrameElement>,
    prevBounds: { x: number; y: number; width: number; height: number },
  ) => {
    const frame = elements.find((el): el is FrameElement => el.id === frameId && el.type === 'frame')
    if (!frame) return

    const rawW = updates.width ?? frame.width
    const rawH = updates.height ?? frame.height
    const clamped = clampFrameSize(rawW, rawH)
    const ratio = frame.aspectRatio || getFrameAspectRatio(frame.width, frame.height)
    let width = clamped.width
    let height = width / ratio
    if (height < FRAME_MIN_HEIGHT) {
      height = FRAME_MIN_HEIGHT
      width = height * ratio
    }
    if (height > FRAME_MAX_HEIGHT) {
      height = FRAME_MAX_HEIGHT
      width = height * ratio
    }
    if (width < FRAME_MIN_WIDTH) {
      width = FRAME_MIN_WIDTH
      height = width / ratio
    }
    if (width > FRAME_MAX_WIDTH) {
      width = FRAME_MAX_WIDTH
      height = width / ratio
    }

    const updatedFrame: FrameElement = {
      ...frame,
      ...updates,
      width,
      height,
      aspectRatio: getFrameAspectRatio(width, height),
    }

    let next = elements.map((el) => (el.id === frameId ? updatedFrame : el))
    next = scaleFrameChildren(updatedFrame, prevBounds, next)
    commitElements(next)
  }

  const handleSelectFrame = (frameId: string) => {
    handleSelectElement(frameId)
    setRightSidebarOpen(true)
  }

  const blurTextEditor = () => {
    const active = document.activeElement
    if (active instanceof HTMLTextAreaElement) {
      active.blur()
    }
  }

  const handleSelectElement = (id: string, multi?: boolean) => {
    if (editingTextId && editingTextId !== id) {
      blurTextEditor()
    }
    selectElement(id, multi)
  }

  const startTextEdit = (id: string) => {
    const stage = stageRef.current
    const node = stage?.findOne(`#${id}`)
    if (node?.getClassName() === 'Text') {
      const textNode = node as Konva.Text
      const scaleX = textNode.scaleX()
      if (scaleX !== 1) {
        handleElementChange(id, { width: textNode.width() * scaleX })
        textNode.scaleX(1)
        textNode.scaleY(1)
      }
    }
    handleSelectElement(id)
    setEditingTextId(id)
  }

  const getPointerPos = () => {
    const stage = stageRef.current
    if (!stage) return { x: 0, y: 0 }
    const pos = stage.getPointerPosition()
    if (!pos) return { x: 0, y: 0 }
    return {
      x: (pos.x - pan.x) / zoom,
      y: (pos.y - pan.y) / zoom,
    }
  }

  const updateSelectionPreview = (startX: number, startY: number, pos: { x: number; y: number }) => {
    const width = Math.abs(pos.x - startX)
    const height = Math.abs(pos.y - startY)
    setSelectionPreview({
      x: Math.min(startX, pos.x),
      y: Math.min(startY, pos.y),
      width,
      height,
    })
  }

  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (currentTool === 'hand' || isPanning || isShiftHandHold || isScrollPanHold) return

    blurTextEditor()

    const clickedOnEmpty = e.target === e.target.getStage()
    if (clickedOnEmpty) {
      if (currentTool === 'select') {
        const pos = getPointerPos()
        selectionRef.current = { startX: pos.x, startY: pos.y }
        return
      }

      clearSelection()

      const pos = getPointerPos()
      drawingRef.current = { startX: pos.x, startY: pos.y }

      if (currentTool === 'text' && activeCanvas) {
        void createTextAt(pos.x, pos.y)
        drawingRef.current = null
        return
      }

      if (currentTool === 'color' && activeCanvas) {
        void createPaletteAt(pos.x, pos.y)
        drawingRef.current = null
        return
      }

      if (currentTool === 'markdown' && activeCanvas) {
        void createMarkdownAt(pos.x, pos.y)
        drawingRef.current = null
        return
      }

      if (currentTool === 'frame' && activeCanvas) {
        void createFrameAt(pos.x, pos.y)
        drawingRef.current = null
      }
    }
  }

  const createMarkdownAt = async (x: number, y: number) => {
    if (!activeCanvas) return
    const mdMedia = await createMarkdownMedia(
      activeCanvas.projectId,
      activeCanvas.id,
      MARKDOWN_DEFAULT_CONTENT,
    )
    useEditorStore.getState().setMarkdownContent(mdMedia.id, MARKDOWN_DEFAULT_CONTENT)
    const maxZ = elements.reduce((m, el) => Math.max(m, el.zIndex), 0)
    const el = await createElement({
      projectId: activeCanvas.projectId,
      canvasId: activeCanvas.id,
      type: 'markdown',
      x,
      y,
      width: MARKDOWN_DEFAULT_SIZE.width,
      height: MARKDOWN_DEFAULT_SIZE.height,
      rotation: 0,
      opacity: 1,
      zIndex: maxZ + 1,
      contentId: mdMedia.id,
      fontFamily: 'Inter',
      textColor: '#111827',
      backgroundColor: '#FFFFFF',
      padding: MARKDOWN_CARD_PADDING,
      radius: MARKDOWN_CARD_RADIUS,
    } as Omit<MarkdownElement, 'id' | 'createdAt' | 'updatedAt'>)
    addElementLocal(el)
    const newElements = [...elements, el]
    setElements(newElements)
    useHistoryStore.getState().pushHistory(activeCanvas.id, newElements)
    debouncedSave(activeCanvas, newElements)
    handleSelectElement(el.id)
    setCurrentTool('select')
  }

  const createPaletteAt = async (x: number, y: number) => {
    if (!activeCanvas) return
    const colorCount = 3
    const { width, height } = getPaletteDimensions(colorCount)
    const maxZ = elements.reduce((m, el) => Math.max(m, el.zIndex), 0)
    const el = await createElement({
      projectId: activeCanvas.projectId,
      canvasId: activeCanvas.id,
      type: 'palette',
      x,
      y,
      width,
      height,
      rotation: 0,
      opacity: 1,
      zIndex: maxZ + 1,
      colors: [...PALETTE_DEFAULT_COLORS],
      colorCount,
    } as Omit<PaletteElement, 'id' | 'createdAt' | 'updatedAt'>)
    addElementLocal(el)
    const newElements = [...elements, el]
    setElements(newElements)
    useHistoryStore.getState().pushHistory(activeCanvas.id, newElements)
    debouncedSave(activeCanvas, newElements)
    handleSelectElement(el.id)
    setCurrentTool('select')
  }

  const createFrameAt = async (x: number, y: number) => {
    if (!activeCanvas) return
    const { frame, elements: newElements } = await createEmptyFrameAt(activeCanvas, elements, x, y)
    setElements(newElements)
    useHistoryStore.getState().pushHistory(activeCanvas.id, newElements)
    debouncedSave(activeCanvas, newElements)
    handleSelectElement(frame.id)
    setRightSidebarOpen(true)
    setCurrentTool('select')
  }

  const createTextAt = async (x: number, y: number) => {
    if (!activeCanvas) return
    const maxZ = elements.reduce((m, el) => Math.max(m, el.zIndex), 0)
    const el = await createElement({
      projectId: activeCanvas.projectId,
      canvasId: activeCanvas.id,
      type: 'text',
      x,
      y,
      width: 200,
      height: 40,
      rotation: 0,
      opacity: 1,
      zIndex: maxZ + 1,
      text: 'Text',
      fontFamily: 'Inter',
      fontSize: 24,
      fontWeight: 'regular',
      italic: false,
      underline: false,
      textAlign: 'left',
      color: defaultColor,
    } as Omit<TextElement, 'id' | 'createdAt' | 'updatedAt'>)
    addElementLocal(el)
    const newElements = [...elements, el]
    setElements(newElements)
    useHistoryStore.getState().pushHistory(activeCanvas.id, newElements)
    debouncedSave(activeCanvas, newElements)
    handleSelectElement(el.id)
    setEditingTextId(el.id)
    setCurrentTool('select')
  }

  const openContextMenuAtPointer = (mode: 'selection' | 'element', elementId?: string) => {
    const stage = stageRef.current
    const container = containerRef.current
    if (!stage || !container) return
    const pointer = stage.getPointerPosition()
    if (!pointer) return
    const rect = container.getBoundingClientRect()
    useEditorStore.getState().setContextMenu({
      mode,
      elementId,
      x: rect.left + pointer.x,
      y: rect.top + pointer.y,
    })
  }

  const updateShapePreview = (startX: number, startY: number, pos: { x: number; y: number }) => {
    const width = Math.abs(pos.x - startX)
    const height = Math.abs(pos.y - startY)
    const x = Math.min(startX, pos.x)
    const y = Math.min(startY, pos.y)

    if (currentTool === 'rect') {
      setShapePreview({ tool: 'rect', x, y, width, height })
    } else if (currentTool === 'circle') {
      const size = Math.max(width, height)
      setShapePreview({ tool: 'circle', x, y, width: size, height: size })
    }
  }

  const handleStageMouseMove = () => {
    if (selectionRef.current && currentTool === 'select') {
      const { startX, startY } = selectionRef.current
      updateSelectionPreview(startX, startY, getPointerPos())
      return
    }
    if (!drawingRef.current) return
    if (currentTool !== 'rect' && currentTool !== 'circle') return
    const { startX, startY } = drawingRef.current
    updateShapePreview(startX, startY, getPointerPos())
  }

  const finishMarqueeSelection = () => {
    if (!selectionRef.current || currentTool !== 'select') return false

    const { startX, startY } = selectionRef.current
    const pos = getPointerPos()
    selectionRef.current = null
    setSelectionPreview(null)

    const width = Math.abs(pos.x - startX)
    const height = Math.abs(pos.y - startY)

    if (width < 5 && height < 5) {
      clearSelection()
      return true
    }

    const selRect = {
      x: Math.min(startX, pos.x),
      y: Math.min(startY, pos.y),
      width,
      height,
    }

    const stage = stageRef.current
    const layer = stage?.getLayers()[0]
    if (!stage || !layer) {
      clearSelection()
      return true
    }

    const ids = elements
      .filter((el) => {
        const node = stage.findOne(`#${el.id}`)
        if (!node) return false
        const box = node.getClientRect({ relativeTo: layer })
        const pad = el.type === 'arrow' ? ARROW_HIT_STROKE_WIDTH / 2 : 0
        const hitBox = {
          x: box.x - pad,
          y: box.y - pad,
          width: box.width + pad * 2,
          height: box.height + pad * 2,
        }
        return rectsIntersect(selRect, hitBox)
      })
      .map((el) => el.id)

    setSelectedElementIds(ids)
    return true
  }

  const handleStageMouseUp = async () => {
    if (finishMarqueeSelection()) return
    if (!drawingRef.current || !activeCanvas) return
    const { startX, startY } = drawingRef.current
    const pos = getPointerPos()
    drawingRef.current = null
    setShapePreview(null)

    const width = Math.abs(pos.x - startX)
    const height = Math.abs(pos.y - startY)
    if (width < 5 && height < 5 && currentTool !== 'arrow') return

    const x = Math.min(startX, pos.x)
    const y = Math.min(startY, pos.y)
    const maxZ = elements.reduce((m, el) => Math.max(m, el.zIndex), 0)

    let el: CanvasElement | null = null

    if (currentTool === 'rect') {
      el = await createElement({
        projectId: activeCanvas.projectId,
        canvasId: activeCanvas.id,
        type: 'shape',
        shape: 'rect',
        x,
        y,
        width: Math.max(width, 20),
        height: Math.max(height, 20),
        rotation: 0,
        opacity: 1,
        zIndex: maxZ + 1,
        fill: defaultColor,
        fillOpacity: 1,
        stroke: '#1E1E1E',
        strokeOpacity: 0.2,
        strokeWidth: 1,
        radius: 4,
      } as Omit<ShapeElement, 'id' | 'createdAt' | 'updatedAt'>)
    } else if (currentTool === 'circle') {
      const size = Math.max(width, height, 20)
      el = await createElement({
        projectId: activeCanvas.projectId,
        canvasId: activeCanvas.id,
        type: 'shape',
        shape: 'circle',
        x,
        y,
        width: size,
        height: size,
        rotation: 0,
        opacity: 1,
        zIndex: maxZ + 1,
        fill: defaultColor,
        fillOpacity: 1,
        stroke: 'transparent',
        strokeOpacity: 0,
        strokeWidth: 0,
      } as Omit<ShapeElement, 'id' | 'createdAt' | 'updatedAt'>)
    } else if (currentTool === 'arrow') {
      el = await createElement({
        projectId: activeCanvas.projectId,
        canvasId: activeCanvas.id,
        type: 'arrow',
        x: startX,
        y: startY,
        width: Math.abs(pos.x - startX),
        height: Math.abs(pos.y - startY),
        rotation: 0,
        opacity: 1,
        zIndex: maxZ + 1,
        stroke: defaultColor,
        strokeOpacity: 1,
        strokeWidth: 2,
        dashed: false,
        startHead: false,
        endHead: true,
        points: [0, 0, pos.x - startX, pos.y - startY],
      } as Omit<ArrowElement, 'id' | 'createdAt' | 'updatedAt'>)
    }

    if (el) {
      addElementLocal(el)
      const newElements = [...elements, el]
      setElements(newElements)
      useHistoryStore.getState().pushHistory(activeCanvas.id, newElements)
      debouncedSave(activeCanvas, newElements)
      handleSelectElement(el.id)
      setCurrentTool('select')
    }
  }

  if (!activeCanvas) {
    return (
      <div className="flex flex-1 items-center justify-center bg-canvas-bg text-text-secondary">
        <div className="text-center">
          <p className="text-lg font-medium">No canvas selected</p>
          <p className="mt-1 text-sm">Create or select a canvas from the sidebar</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`relative flex-1 overflow-hidden outline-none ${activeCanvas.gridEnabled ? 'dot-grid' : 'bg-canvas-bg'}${isShiftHandHold || isScrollPanHold ? ' cursor-grab active:cursor-grabbing' : ''}`}
      style={{ backgroundColor: activeCanvas.gridEnabled ? undefined : activeCanvas.background }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        scaleX={zoom}
        scaleY={zoom}
        x={pan.x}
        y={pan.y}
        draggable={!isEditingText && !isShiftHandHold && !isScrollPanHold && (currentTool === 'hand' || isPanning)}
        onDragEnd={(e) => {
          if (currentTool === 'hand' || isPanning) {
            setPan({ x: e.target.x(), y: e.target.y() })
          }
        }}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={() => void handleStageMouseUp()}
        onContextMenu={(e) => {
          if (e.target !== e.target.getStage()) return
          e.evt.preventDefault()
          if (selectedElementIds.length > 0) {
            openContextMenuAtPointer('selection')
          }
        }}
      >
        <Layer>
          {elements.map((el) =>
            renderElement(
              el,
              elements,
              selectedIds,
              editingTextId,
              handleSelectElement,
              startTextEdit,
              handleElementChange,
              setOpenMarkdownId,
              (elementId, evt) => {
                evt.evt.preventDefault()
                const isInSelection = selectedElementIds.includes(elementId)
                openContextMenuAtPointer(
                  isInSelection && selectedElementIds.length > 1 ? 'selection' : 'element',
                  elementId,
                )
              },
              handleFrameDragEnd,
              handleFrameTransformEnd,
              handleSelectFrame,
            ),
          )}
          {selectionPreview && (
            <Rect
              x={selectionPreview.x}
              y={selectionPreview.y}
              width={selectionPreview.width}
              height={selectionPreview.height}
              fillEnabled={false}
              stroke="#5B4DFF"
              strokeWidth={1}
              dash={[4, 4]}
              listening={false}
            />
          )}
          {shapePreview?.tool === 'rect' && (
            <Rect
              x={shapePreview.x}
              y={shapePreview.y}
              width={shapePreview.width}
              height={shapePreview.height}
              fill={defaultColor}
              fillOpacity={0.35}
              stroke="#1E1E1E"
              strokeOpacity={0.2}
              strokeWidth={1}
              cornerRadius={4}
              listening={false}
            />
          )}
          {shapePreview?.tool === 'circle' && (
            <Circle
              x={shapePreview.x + shapePreview.width / 2}
              y={shapePreview.y + shapePreview.height / 2}
              radius={shapePreview.width / 2}
              fill={defaultColor}
              fillOpacity={0.35}
              listening={false}
            />
          )}
          <Transformer
            ref={transformerRef}
            keepRatio={lockAspectRatio}
            rotateEnabled={!frameSelected}
            enabledAnchors={
              lockAspectRatio
                ? ['top-left', 'top-right', 'bottom-left', 'bottom-right']
                : undefined
            }
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 5 || newBox.height < 5) return oldBox
              if (frameSelected) {
                const w = Math.max(FRAME_MIN_WIDTH, Math.min(FRAME_MAX_WIDTH, newBox.width))
                const h = Math.max(FRAME_MIN_HEIGHT, Math.min(FRAME_MAX_HEIGHT, newBox.height))
                return { ...newBox, width: w, height: h }
              }
              return newBox
            }}
            borderStroke="#5B4DFF"
            anchorStroke="#5B4DFF"
            anchorFill="#FFFFFF"
            anchorSize={8}
            anchorCornerRadius={4}
            rotateAnchorOffset={20}
          />
        </Layer>
      </Stage>
      <CanvasGestureCue />
      {editingTextId && (
        <TextEditOverlay
          elementId={editingTextId}
          stageRef={stageRef}
          onCommit={(text) => {
            handleElementChange(editingTextId, { text })
            setEditingTextId(null)
          }}
          onCancel={() => setEditingTextId(null)}
        />
      )}
    </div>
  )
}
