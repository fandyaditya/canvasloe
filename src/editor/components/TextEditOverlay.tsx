import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type Konva from 'konva'
import type { TextElement } from '../../db/schema'
import { useEditorStore } from '../state/editorStore'

const weightMap = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const

type TextEditOverlayProps = {
  elementId: string
  stageRef: React.RefObject<Konva.Stage | null>
  containerRef: React.RefObject<HTMLDivElement | null>
  onCommit: (text: string) => void
  onCancel: () => void
}

export function TextEditOverlay({
  elementId,
  stageRef,
  containerRef,
  onCommit,
  onCancel,
}: TextEditOverlayProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const element = useEditorStore((s) =>
    s.elements.find((el): el is TextElement => el.id === elementId && el.type === 'text'),
  )
  const zoom = useEditorStore((s) => s.zoom)
  const pan = useEditorStore((s) => s.pan)
  const setIsEditingText = useEditorStore((s) => s.setIsEditingText)

  const [draft, setDraft] = useState(element?.text ?? '')
  const [style, setStyle] = useState<React.CSSProperties>({ display: 'none' })

  useEffect(() => {
    setIsEditingText(true)
    return () => setIsEditingText(false)
  }, [setIsEditingText])

  useEffect(() => {
    setDraft(element?.text ?? '')
  }, [element?.text, elementId])

  const updatePosition = () => {
    const stage = stageRef.current
    const container = containerRef.current
    if (!stage || !container || !element) return

    const node = stage.findOne(`#${elementId}`) as Konva.Text | undefined
    if (!node) return

    const nodeRect = node.getClientRect()
    const containerRect = container.getBoundingClientRect()
    const scale = stage.scaleX()
    const rotation = node.rotation()
    const fontSize = element.fontSize * scale
    const width = Math.max(nodeRect.width, fontSize * 2)

    setStyle({
      position: 'absolute',
      top: nodeRect.y - containerRect.top,
      left: nodeRect.x - containerRect.left,
      width,
      minHeight: fontSize * 1.2,
      fontSize,
      fontFamily: element.fontFamily,
      fontWeight: weightMap[element.fontWeight],
      fontStyle: element.italic ? 'italic' : 'normal',
      textDecoration: element.underline ? 'underline' : 'none',
      textAlign: element.textAlign,
      color: element.color,
      lineHeight: '1.2',
      transform: rotation ? `rotate(${rotation}deg)` : undefined,
      transformOrigin: 'left top',
      padding: 0,
      margin: 0,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      resize: 'none',
      overflow: 'hidden',
      zIndex: 10,
      boxSizing: 'content-box',
    })
  }

  useLayoutEffect(() => {
    updatePosition()
    const raf = requestAnimationFrame(updatePosition)
    return () => cancelAnimationFrame(raf)
  }, [elementId, zoom, pan.x, pan.y, element?.x, element?.y, element?.rotation, element?.width])

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.focus()
    textarea.select()
    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [elementId, style])

  const autoResize = () => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
  }

  const commit = () => {
    onCommit(draft)
  }

  if (!element) return null

  return (
    <textarea
      ref={textareaRef}
      value={draft}
      style={style}
      onChange={(e) => {
        setDraft(e.target.value)
        autoResize()
      }}
      onBlur={commit}
      onKeyDown={(e) => {
        e.stopPropagation()
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault()
          commit()
        }
        if (e.key === 'Escape') {
          e.preventDefault()
          onCancel()
        }
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    />
  )
}
