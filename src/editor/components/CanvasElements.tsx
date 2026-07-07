import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Image as KonvaImage, Rect, Circle, Text, Arrow, Line, Group } from 'react-konva'
import type Konva from 'konva'
import type { ArrowElement, CanvasElement, FrameElement, ImageElement, MarkdownElement, PaletteElement, ShapeElement, TextElement } from '../../db/schema'
import { getChildOrderIndex, getFrameForChild } from '../frame/frameLayout'
import { extractMarkdownTitle, getCanvasPreviewLines, isMarkdownTruncated } from '../../utils/markdown'
import { MARKDOWN_CARD_PADDING, MARKDOWN_CARD_RADIUS, MARKDOWN_ASPECT_RATIO, IMAGE_CAPTION_FONT_SIZE, IMAGE_CAPTION_GAP, IMAGE_CAPTION_LINE_HEIGHT, ARROW_HIT_STROKE_WIDTH } from '../../db/schema'
import { readMediaBlob } from '../../db/assetRepo'
import { getImageElement } from '../../utils/objectUrlCache'
import { getImageCaptionBlockHeight } from '../../utils/imageCaption'
import { readMarkdownContent } from '../../db/mediaRepo'
import { useEditorStore } from '../state/editorStore'

const weightMap = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const

const PALETTE_PADDING = 12
const PALETTE_SWATCH_WIDTH = 76
const PALETTE_SWATCH_HEIGHT = 40
const PALETTE_SWATCH_RADIUS = 4
const PALETTE_ROW_GAP = 8
const PALETTE_TEXT_GAP = 4
const PALETTE_TEXT_SIZE = 9
const PALETTE_ROW_HEIGHT = PALETTE_SWATCH_HEIGHT + PALETTE_TEXT_GAP + 12

function toPickerColor(color: string): string {
  if (/^#[0-9A-Fa-f]{6}$/.test(color)) return color
  return '#000000'
}

function openSwatchColorPicker(color: string, onPick: (color: string) => void) {
  const input = document.createElement('input')
  input.type = 'color'
  input.value = toPickerColor(color)
  input.onchange = () => onPick(input.value)
  input.click()
}

export function CanvasTextElement({
  element,
  isEditing,
  onSelect,
  onStartEdit,
  onChange,
}: {
  element: TextElement
  isSelected?: boolean
  isEditing?: boolean
  onSelect: (multi?: boolean) => void
  onStartEdit: () => void
  onChange: (updates: Partial<TextElement>) => void
}) {
  const shapeRef = useRef<Konva.Text>(null)
  const handleSelect = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    e.cancelBubble = true
    onSelect(e.evt instanceof MouseEvent && (e.evt.ctrlKey || e.evt.metaKey))
  }

  return (
    <Text
      ref={shapeRef}
      id={element.id}
      x={element.x}
      y={element.y}
      width={element.width}
      text={element.text}
      fontFamily={element.fontFamily}
      fontSize={element.fontSize}
      fontStyle={`${element.italic ? 'italic ' : ''}${weightMap[element.fontWeight]}`}
      textDecoration={element.underline ? 'underline' : ''}
      align={element.textAlign}
      fill={element.color}
      opacity={isEditing ? 0 : element.opacity}
      rotation={element.rotation}
      draggable={!element.locked && !isEditing}
      onClick={handleSelect}
      onTap={handleSelect}
      onDblClick={(e) => {
        e.cancelBubble = true
        onStartEdit()
      }}
      onDblTap={(e) => {
        e.cancelBubble = true
        onStartEdit()
      }}
      onDragEnd={(e) => onChange({ x: e.target.x(), y: e.target.y() })}
      onTransformEnd={() => {
        const node = shapeRef.current
        if (!node) return
        onChange({
          x: node.x(),
          y: node.y(),
          width: node.width() * node.scaleX(),
          rotation: node.rotation(),
        })
        node.scaleX(1)
        node.scaleY(1)
      }}
    />
  )
}

export function CanvasShapeElement({
  element,
  onSelect,
  onChange,
}: {
  element: ShapeElement
  isSelected?: boolean
  onSelect: (multi?: boolean) => void
  onChange: (updates: Partial<ShapeElement>) => void
}) {
  const shapeRef = useRef<Konva.Rect | Konva.Circle>(null)
  const handleSelect = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    e.cancelBubble = true
    onSelect(e.evt instanceof MouseEvent && (e.evt.ctrlKey || e.evt.metaKey))
  }
  const common = {
    id: element.id,
    x: element.x,
    y: element.y,
    opacity: element.opacity,
    rotation: element.rotation,
    draggable: !element.locked,
    onClick: handleSelect,
    onTap: handleSelect,
    onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => onChange({ x: e.target.x(), y: e.target.y() }),
    onTransformEnd: () => {
      const node = shapeRef.current
      if (!node) return
      const scaleX = node.scaleX()
      const scaleY = node.scaleY()
      onChange({
        x: node.x(),
        y: node.y(),
        width: Math.max(5, node.width() * scaleX),
        height: Math.max(5, node.height() * scaleY),
        rotation: node.rotation(),
      })
      node.scaleX(1)
      node.scaleY(1)
    },
  }

  if (element.shape === 'circle') {
    return (
      <Circle
        ref={shapeRef as React.RefObject<Konva.Circle>}
        {...common}
        x={element.x + element.width / 2}
        y={element.y + element.height / 2}
        radius={element.width / 2}
        fill={element.fill}
        fillOpacity={element.fillOpacity}
        stroke={element.stroke}
        strokeWidth={element.strokeWidth}
        strokeOpacity={element.strokeOpacity}
      />
    )
  }

  return (
    <Rect
      ref={shapeRef as React.RefObject<Konva.Rect>}
      {...common}
      width={element.width}
      height={element.height}
      fill={element.fill}
      fillOpacity={element.fillOpacity}
      stroke={element.stroke}
      strokeWidth={element.strokeWidth}
      strokeOpacity={element.strokeOpacity}
      cornerRadius={element.radius ?? 0}
    />
  )
}

export function CanvasArrowElement({
  element,
  onSelect,
  onChange,
}: {
  element: ArrowElement
  isSelected?: boolean
  onSelect: (multi?: boolean) => void
  onChange: (updates: Partial<ArrowElement>) => void
}) {
  const handleSelect = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    e.cancelBubble = true
    onSelect(e.evt instanceof MouseEvent && (e.evt.ctrlKey || e.evt.metaKey))
  }
  const pts = [
    element.x + (element.points[0] ?? 0),
    element.y + (element.points[1] ?? 0),
    element.x + (element.points[2] ?? element.width),
    element.y + (element.points[3] ?? element.height),
  ]

  const common = {
    id: element.id,
    points: pts,
    stroke: element.stroke,
    strokeWidth: element.strokeWidth,
    hitStrokeWidth: ARROW_HIT_STROKE_WIDTH,
    opacity: element.opacity * element.strokeOpacity,
    dash: element.dashed ? [8, 4] : undefined,
    draggable: !element.locked,
    onClick: handleSelect,
    onTap: handleSelect,
    onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => onChange({ x: e.target.x(), y: e.target.y() }),
  }

  if (element.endHead || element.startHead) {
    return (
      <Arrow
        {...common}
        fill={element.stroke}
        pointerLength={10}
        pointerWidth={10}
        pointerAtBeginning={element.startHead}
        pointerAtEnding={element.endHead}
      />
    )
  }

  return <Line {...common} />
}

export function CanvasImageElement({
  element,
  onSelect,
  onChange,
  onContextMenu,
}: {
  element: ImageElement
  isSelected?: boolean
  onSelect: (multi?: boolean) => void
  onChange: (updates: Partial<ImageElement>) => void
  onContextMenu?: (e: Konva.KonvaEventObject<PointerEvent>) => void
}) {
  const groupRef = useRef<Konva.Group>(null)
  const [image, setImage] = useState<HTMLImageElement | HTMLCanvasElement | null>(null)
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading')

  const handleSelect = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    e.cancelBubble = true
    onSelect(e.evt instanceof MouseEvent && (e.evt.ctrlKey || e.evt.metaKey))
  }

  useEffect(() => {
    let cancelled = false
    setLoadState('loading')
    setImage(null)

    void readMediaBlob(element.assetId)
      .then((blob) => getImageElement(element.assetId, blob))
      .then((loaded) => {
        if (cancelled) return
        setImage(loaded)
        setLoadState('ready')
      })
      .catch(() => {
        if (cancelled) return
        setLoadState('error')
      })

    return () => {
      cancelled = true
    }
  }, [element.assetId])

  const caption = element.caption ?? ''
  const captionBlockHeight = getImageCaptionBlockHeight(caption, element.width)
  const totalHeight = element.height + captionBlockHeight

  return (
    <Group
      ref={groupRef}
      id={element.id}
      x={element.x}
      y={element.y}
      rotation={element.rotation}
      opacity={element.opacity}
      draggable={!element.locked}
      onClick={handleSelect}
      onTap={handleSelect}
      onContextMenu={(e) => {
        e.evt.preventDefault()
        onContextMenu?.(e)
      }}
      onDragEnd={(e) => onChange({ x: e.target.x(), y: e.target.y() })}
      onTransformEnd={() => {
        const node = groupRef.current
        if (!node) return
        const scale = node.scaleX()
        const aspectRatio = element.width / element.height
        const newWidth = Math.max(20, element.width * scale)
        const newHeight = newWidth / aspectRatio
        onChange({
          x: node.x(),
          y: node.y(),
          width: newWidth,
          height: newHeight,
          rotation: node.rotation(),
        })
        node.scaleX(1)
        node.scaleY(1)
      }}
    >
      <Rect width={element.width} height={totalHeight} fill="transparent" />
      <Group
        clipFunc={
          element.radius > 0
            ? (ctx) => {
                const w = element.width
                const h = element.height
                const r = element.radius
                ctx.beginPath()
                ctx.moveTo(r, 0)
                ctx.lineTo(w - r, 0)
                ctx.quadraticCurveTo(w, 0, w, r)
                ctx.lineTo(w, h - r)
                ctx.quadraticCurveTo(w, h, w - r, h)
                ctx.lineTo(r, h)
                ctx.quadraticCurveTo(0, h, 0, h - r)
                ctx.lineTo(0, r)
                ctx.quadraticCurveTo(0, 0, r, 0)
                ctx.closePath()
              }
            : undefined
        }
      >
        <Rect
          width={element.width}
          height={element.height}
          fill={
            loadState === 'error' ? '#FEE2E2' : loadState === 'loading' ? '#F3F4F6' : 'transparent'
          }
          stroke={loadState === 'error' ? '#FCA5A5' : loadState === 'loading' ? '#D1D5DB' : undefined}
          strokeWidth={loadState === 'ready' ? 0 : 1}
          cornerRadius={element.radius}
        />
        {image ? (
          <KonvaImage
            image={image}
            width={element.width}
            height={element.height}
            listening={false}
          />
        ) : null}
      </Group>
      {caption.trim() ? (
        <Text
          x={0}
          y={element.height + IMAGE_CAPTION_GAP}
          width={element.width}
          text={caption}
          fontFamily="Inter"
          fontSize={IMAGE_CAPTION_FONT_SIZE}
          lineHeight={IMAGE_CAPTION_LINE_HEIGHT}
          fill="#6B7280"
          align="center"
          wrap="word"
          listening={false}
        />
      ) : null}
    </Group>
  )
}

export function CanvasPaletteElement({
  element,
  onSelect,
  onChange,
}: {
  element: PaletteElement
  isSelected?: boolean
  onSelect: (multi?: boolean) => void
  onChange: (updates: Partial<PaletteElement>) => void
}) {
  const groupRef = useRef<Konva.Group>(null)
  const baseWidth = PALETTE_PADDING * 2 + PALETTE_SWATCH_WIDTH
  const baseHeight =
    PALETTE_PADDING * 2 +
    element.colorCount * PALETTE_ROW_HEIGHT +
    (element.colorCount - 1) * PALETTE_ROW_GAP
  const scale = element.width / baseWidth

  const handleSelect = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    e.cancelBubble = true
    onSelect(e.evt instanceof MouseEvent && (e.evt.ctrlKey || e.evt.metaKey))
  }

  const activeColors = element.colors.slice(0, element.colorCount)

  return (
    <Group
      ref={groupRef}
      id={element.id}
      x={element.x}
      y={element.y}
      scaleX={scale}
      scaleY={scale}
      opacity={element.opacity}
      rotation={element.rotation}
      draggable={!element.locked}
      onClick={handleSelect}
      onTap={handleSelect}
      onDragEnd={(e) => onChange({ x: e.target.x(), y: e.target.y() })}
      onTransformEnd={() => {
        const node = groupRef.current
        if (!node) return
        const uniformScale = node.scaleX()
        const aspectRatio = baseWidth / baseHeight
        const newWidth = Math.max(40, baseWidth * uniformScale)
        const newHeight = newWidth / aspectRatio
        onChange({
          x: node.x(),
          y: node.y(),
          width: newWidth,
          height: newHeight,
          rotation: node.rotation(),
        })
        node.scaleX(1)
        node.scaleY(1)
      }}
    >
      <Rect
        width={baseWidth}
        height={baseHeight}
        fill="#FFFFFF"
        cornerRadius={8}
        stroke="#E5E7EB"
        strokeWidth={1}
        shadowColor="rgba(0,0,0,0.08)"
        shadowBlur={8}
        shadowOffsetY={2}
      />
      {activeColors.map((color, index) => {
        const rowY = PALETTE_PADDING + index * (PALETTE_ROW_HEIGHT + PALETTE_ROW_GAP)
        return (
          <Group key={index}>
            <Rect
              x={PALETTE_PADDING}
              y={rowY}
              width={PALETTE_SWATCH_WIDTH}
              height={PALETTE_SWATCH_HEIGHT}
              fill={color}
              cornerRadius={PALETTE_SWATCH_RADIUS}
              onClick={(e) => {
                e.cancelBubble = true
                openSwatchColorPicker(color, (picked) => {
                  const colors = [...element.colors]
                  colors[index] = picked
                  onChange({ colors })
                })
              }}
              onTap={(e) => {
                e.cancelBubble = true
                openSwatchColorPicker(color, (picked) => {
                  const colors = [...element.colors]
                  colors[index] = picked
                  onChange({ colors })
                })
              }}
            />
            <Text
              x={PALETTE_PADDING}
              y={rowY + PALETTE_SWATCH_HEIGHT + PALETTE_TEXT_GAP}
              width={PALETTE_SWATCH_WIDTH}
              text={color.toUpperCase()}
              fontFamily="Inter"
              fontSize={PALETTE_TEXT_SIZE}
              fill="#6B7280"
              align="center"
              listening={false}
            />
          </Group>
        )
      })}
    </Group>
  )
}

export function CanvasMarkdownElement({
  element,
  onSelect,
  onChange,
  onOpenDetail,
  onContextMenu,
}: {
  element: MarkdownElement
  isSelected?: boolean
  onSelect: (multi?: boolean) => void
  onChange: (updates: Partial<MarkdownElement>) => void
  onOpenDetail: () => void
  onContextMenu?: (e: Konva.KonvaEventObject<PointerEvent>) => void
}) {
  const groupRef = useRef<Konva.Group>(null)
  const cacheVersion = useEditorStore((s) => s.markdownCacheVersion)
  const setMarkdownContent = useEditorStore((s) => s.setMarkdownContent)
  const markdown = useEditorStore.getState().getMarkdownContent(element.contentId) ?? ''
  void cacheVersion

  useEffect(() => {
    if (markdown) return
    void readMarkdownContent(element.contentId)
      .then((text) => setMarkdownContent(element.contentId, text))
      .catch(() => setMarkdownContent(element.contentId, ''))
  }, [element.contentId, markdown, setMarkdownContent])

  const title = extractMarkdownTitle(markdown)
  const previewLines = getCanvasPreviewLines(markdown, 4)
  const truncated = isMarkdownTruncated(markdown)

  const padding = MARKDOWN_CARD_PADDING
  const radius = MARKDOWN_CARD_RADIUS
  const iconSize = 14
  const contentX = padding
  const iconY = padding
  const titleY = iconY + iconSize + 10
  const previewStartY = titleY + 20
  const footerY = element.height - padding - 12
  const previewWidth = element.width - padding * 2
  const previewHeight = footerY - previewStartY - (truncated ? 14 : 6)

  const handleSelect = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    e.cancelBubble = true
    onSelect(e.evt instanceof MouseEvent && (e.evt.ctrlKey || e.evt.metaKey))
  }

  return (
    <Group
      ref={groupRef}
      id={element.id}
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      opacity={element.opacity}
      rotation={element.rotation}
      draggable={!element.locked}
      onClick={handleSelect}
      onTap={handleSelect}
      onDblClick={(e) => {
        e.cancelBubble = true
        onOpenDetail()
      }}
      onDblTap={(e) => {
        e.cancelBubble = true
        onOpenDetail()
      }}
      onContextMenu={(e) => {
        e.evt.preventDefault()
        onContextMenu?.(e)
      }}
      onDragEnd={(e) => onChange({ x: e.target.x(), y: e.target.y() })}
      onTransformEnd={() => {
        const node = groupRef.current
        if (!node) return
        const scale = node.scaleX()
        const newWidth = Math.max(160, node.width() * scale)
        const newHeight = newWidth / MARKDOWN_ASPECT_RATIO
        onChange({
          x: node.x(),
          y: node.y(),
          width: newWidth,
          height: newHeight,
          rotation: node.rotation(),
        })
        node.scaleX(1)
        node.scaleY(1)
      }}
    >
      <Rect
        width={element.width}
        height={element.height}
        fill={element.backgroundColor}
        cornerRadius={radius}
        stroke="#E5E7EB"
        strokeWidth={1}
        shadowColor="rgba(0,0,0,0.06)"
        shadowBlur={6}
        shadowOffsetY={2}
      />
      <Rect
        x={contentX}
        y={iconY}
        width={iconSize}
        height={iconSize}
        fill="#F3F4F6"
        cornerRadius={2}
        stroke="#9CA3AF"
        strokeWidth={1}
      />
      <Line points={[contentX + 3, iconY + 5, contentX + iconSize - 3, iconY + 5]} stroke="#9CA3AF" strokeWidth={1} listening={false} />
      <Line points={[contentX + 3, iconY + 8, contentX + iconSize - 3, iconY + 8]} stroke="#9CA3AF" strokeWidth={1} listening={false} />
      <Line points={[contentX + 3, iconY + 11, contentX + iconSize - 6, iconY + 11]} stroke="#9CA3AF" strokeWidth={1} listening={false} />
      <Text
        x={contentX}
        y={titleY}
        width={element.width - padding * 2}
        text={title}
        fontFamily={element.fontFamily}
        fontSize={13}
        fontStyle="bold"
        fill={element.textColor}
        listening={false}
      />
      {previewLines.length > 0 && (
        <Text
          x={contentX}
          y={previewStartY}
          width={previewWidth}
          height={Math.max(0, previewHeight)}
          text={previewLines.join('\n')}
          fontFamily={element.fontFamily}
          fontSize={10}
          lineHeight={1.5}
          fill="#6B7280"
          wrap="word"
          listening={false}
        />
      )}
      {truncated && (
        <Text
          x={contentX}
          y={footerY}
          text="200 char preview"
          fontFamily="Inter"
          fontSize={9}
          fill="#9CA3AF"
          listening={false}
        />
      )}
    </Group>
  )
}

const BADGE_SIZE = 20

function FrameOrderBadge({
  childId,
  x,
  y,
  order,
  onSelectFrame,
}: {
  childId: string
  x: number
  y: number
  order: number
  onSelectFrame: () => void
}) {
  return (
    <Group
      id={`${childId}-frame-badge`}
      x={x - 4}
      y={y - 4}
      onClick={(e) => {
        e.cancelBubble = true
        onSelectFrame()
      }}
      onTap={(e) => {
        e.cancelBubble = true
        onSelectFrame()
      }}
    >
      <Circle x={BADGE_SIZE / 2} y={BADGE_SIZE / 2} radius={BADGE_SIZE / 2} fill="#5B4DFF" />
      <Text
        x={0}
        y={4}
        width={BADGE_SIZE}
        text={String(order)}
        fontSize={11}
        fontFamily="Inter"
        fill="#FFFFFF"
        align="center"
      />
    </Group>
  )
}

export function CanvasFrameElement({
  element,
  onSelect,
  onFrameDragEnd,
  onFrameTransformEnd,
}: {
  element: FrameElement
  isSelected?: boolean
  onSelect: (multi?: boolean) => void
  onFrameDragEnd: (dx: number, dy: number) => void
  onFrameTransformEnd: (updates: Partial<FrameElement>, prevBounds: { x: number; y: number; width: number; height: number }) => void
}) {
  const shapeRef = useRef<Konva.Rect>(null)
  const dragStart = useRef({ x: element.x, y: element.y })
  const childDragStart = useRef<Map<string, { x: number; y: number }>>(new Map())
  const transformStart = useRef({ x: element.x, y: element.y, width: element.width, height: element.height })

  const syncChildrenDuringDrag = (dx: number, dy: number) => {
    const stage = shapeRef.current?.getStage()
    if (!stage) return

    for (const childId of element.childIds) {
      const start = childDragStart.current.get(childId)
      const node = stage.findOne(`#${childId}`)
      if (start && node) node.position({ x: start.x + dx, y: start.y + dy })

      const badgeStart = childDragStart.current.get(`${childId}-badge`)
      const badge = stage.findOne(`#${childId}-frame-badge`)
      if (badgeStart && badge) badge.position({ x: badgeStart.x + dx, y: badgeStart.y + dy })
    }
  }

  const captureChildDragStart = () => {
    const stage = shapeRef.current?.getStage()
    childDragStart.current.clear()
    if (!stage) return

    for (const childId of element.childIds) {
      const node = stage.findOne(`#${childId}`)
      if (node) childDragStart.current.set(childId, { x: node.x(), y: node.y() })

      const badge = stage.findOne(`#${childId}-frame-badge`)
      if (badge) childDragStart.current.set(`${childId}-badge`, { x: badge.x(), y: badge.y() })
    }
  }

  const handleSelect = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    e.cancelBubble = true
    onSelect(e.evt instanceof MouseEvent && (e.evt.ctrlKey || e.evt.metaKey))
  }

  return (
    <Rect
      ref={shapeRef}
      id={element.id}
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      fill={element.backgroundColor}
      cornerRadius={element.radius}
      opacity={element.opacity}
      rotation={element.rotation}
      draggable={!element.locked}
      onClick={handleSelect}
      onTap={handleSelect}
      onDragStart={() => {
        dragStart.current = { x: element.x, y: element.y }
        captureChildDragStart()
      }}
      onDragMove={(e) => {
        const dx = e.target.x() - dragStart.current.x
        const dy = e.target.y() - dragStart.current.y
        syncChildrenDuringDrag(dx, dy)
      }}
      onDragEnd={(e) => {
        const dx = e.target.x() - dragStart.current.x
        const dy = e.target.y() - dragStart.current.y
        if (dx !== 0 || dy !== 0) onFrameDragEnd(dx, dy)
      }}
      onTransformStart={() => {
        transformStart.current = {
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height,
        }
      }}
      onTransformEnd={() => {
        const node = shapeRef.current
        if (!node) return
        const scale = node.scaleX()
        const newWidth = Math.max(5, node.width() * scale)
        const newHeight = Math.max(5, node.height() * scale)
        onFrameTransformEnd(
          {
            x: node.x(),
            y: node.y(),
            width: newWidth,
            height: newHeight,
            rotation: node.rotation(),
          },
          transformStart.current,
        )
        node.scaleX(1)
        node.scaleY(1)
      }}
    />
  )
}

export function renderElement(
  element: CanvasElement,
  allElements: CanvasElement[],
  selectedIds: Set<string>,
  editingTextId: string | null,
  onSelect: (id: string, multi?: boolean) => void,
  onStartTextEdit: (id: string) => void,
  onChange: (id: string, updates: Partial<CanvasElement>) => void,
  onOpenMarkdown: (id: string) => void,
  onContextMenu?: (elementId: string, e: Konva.KonvaEventObject<PointerEvent>) => void,
  onFrameDragEnd?: (frameId: string, dx: number, dy: number) => void,
  onFrameTransformEnd?: (
    frameId: string,
    updates: Partial<FrameElement>,
    prevBounds: { x: number; y: number; width: number; height: number },
  ) => void,
  onSelectFrame?: (frameId: string) => void,
) {
  const isSelected = selectedIds.has(element.id)
  const handleChange = (updates: Partial<CanvasElement>) => onChange(element.id, updates)
  const handleSelect = (multi?: boolean) => onSelect(element.id, multi)

  const parentFrame = getFrameForChild(element.id, allElements)
  const badge =
    parentFrame && onSelectFrame ? (
      <FrameOrderBadge
        key={`${element.id}-badge`}
        childId={element.id}
        x={element.x}
        y={element.y}
        order={getChildOrderIndex(element.id, parentFrame) + 1}
        onSelectFrame={() => onSelectFrame(parentFrame.id)}
      />
    ) : null

  const wrapWithBadge = (node: ReactNode) => (
    <>
      {node}
      {badge}
    </>
  )

  switch (element.type) {
    case 'frame':
      return (
        <CanvasFrameElement
          key={element.id}
          element={element}
          isSelected={isSelected}
          onSelect={handleSelect}
          onFrameDragEnd={(dx, dy) => onFrameDragEnd?.(element.id, dx, dy)}
          onFrameTransformEnd={(updates, prev) => onFrameTransformEnd?.(element.id, updates, prev)}
        />
      )
    case 'text':
      return wrapWithBadge(
        <CanvasTextElement
          key={element.id}
          element={element}
          isSelected={isSelected}
          isEditing={element.id === editingTextId}
          onSelect={handleSelect}
          onStartEdit={() => onStartTextEdit(element.id)}
          onChange={handleChange}
        />,
      )
    case 'shape':
      return wrapWithBadge(
        <CanvasShapeElement
          key={element.id}
          element={element}
          isSelected={isSelected}
          onSelect={handleSelect}
          onChange={handleChange}
        />,
      )
    case 'arrow':
      return (
        <CanvasArrowElement
          key={element.id}
          element={element}
          isSelected={isSelected}
          onSelect={handleSelect}
          onChange={handleChange}
        />
      )
    case 'image':
      return wrapWithBadge(
        <CanvasImageElement
          key={element.id}
          element={element}
          isSelected={isSelected}
          onSelect={handleSelect}
          onChange={handleChange}
          onContextMenu={(e) => onContextMenu?.(element.id, e)}
        />,
      )
    case 'palette':
      return wrapWithBadge(
        <CanvasPaletteElement
          key={element.id}
          element={element}
          isSelected={isSelected}
          onSelect={handleSelect}
          onChange={handleChange}
        />,
      )
    case 'markdown':
      return wrapWithBadge(
        <CanvasMarkdownElement
          key={element.id}
          element={element}
          isSelected={isSelected}
          onSelect={handleSelect}
          onChange={handleChange}
          onOpenDetail={() => onOpenMarkdown(element.id)}
          onContextMenu={(e) => onContextMenu?.(element.id, e)}
        />,
      )
    default:
      return null
  }
}
