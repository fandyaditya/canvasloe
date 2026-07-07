import { useEditorStore } from './state/editorStore'
import { EmptyInspector } from './inspector/EmptyInspector'
import { TextInspector } from './inspector/TextInspector'
import { ImageInspector } from './inspector/ImageInspector'
import { ShapeInspector } from './inspector/ShapeInspector'
import { ArrowInspector } from './inspector/ArrowInspector'
import { PaletteInspector } from './inspector/PaletteInspector'
import { MarkdownInspector } from './inspector/MarkdownInspector'
import { FrameInspector } from './inspector/FrameInspector'

type RightInspectorProps = {
  onClose: () => void
}

export function RightInspector({ onClose }: RightInspectorProps) {
  const selectedElementIds = useEditorStore((s) => s.selectedElementIds)
  const elements = useEditorStore((s) => s.elements)

  if (selectedElementIds.length !== 1) {
    return <EmptyInspector onClose={onClose} />
  }

  const element = elements.find((el) => el.id === selectedElementIds[0])
  if (!element) return <EmptyInspector onClose={onClose} />

  switch (element.type) {
    case 'text':
      return <TextInspector element={element} onClose={onClose} />
    case 'image':
      return <ImageInspector element={element} onClose={onClose} />
    case 'shape':
      return <ShapeInspector element={element} onClose={onClose} />
    case 'arrow':
      return <ArrowInspector element={element} onClose={onClose} />
    case 'palette':
      return <PaletteInspector element={element} onClose={onClose} />
    case 'markdown':
      return <MarkdownInspector element={element} onClose={onClose} />
    case 'frame':
      return <FrameInspector element={element} onClose={onClose} />
    default:
      return <EmptyInspector onClose={onClose} />
  }
}
