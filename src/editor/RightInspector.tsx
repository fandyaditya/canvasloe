import { useEditorStore } from './state/editorStore'
import { EmptyInspector } from './inspector/EmptyInspector'
import { TextInspector } from './inspector/TextInspector'
import { ImageInspector } from './inspector/ImageInspector'
import { ShapeInspector } from './inspector/ShapeInspector'
import { ArrowInspector } from './inspector/ArrowInspector'
import { PaletteInspector } from './inspector/PaletteInspector'
import { MarkdownInspector } from './inspector/MarkdownInspector'

export function RightInspector() {
  const selectedElementIds = useEditorStore((s) => s.selectedElementIds)
  const elements = useEditorStore((s) => s.elements)

  if (selectedElementIds.length !== 1) {
    return <EmptyInspector />
  }

  const element = elements.find((el) => el.id === selectedElementIds[0])
  if (!element) return <EmptyInspector />

  switch (element.type) {
    case 'text':
      return <TextInspector element={element} />
    case 'image':
      return <ImageInspector element={element} />
    case 'shape':
      return <ShapeInspector element={element} />
    case 'arrow':
      return <ArrowInspector element={element} />
    case 'palette':
      return <PaletteInspector element={element} />
    case 'markdown':
      return <MarkdownInspector element={element} />
    default:
      return <EmptyInspector />
  }
}
