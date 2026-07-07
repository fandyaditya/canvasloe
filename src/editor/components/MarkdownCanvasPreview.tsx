import Konva from 'konva'
import { Rect, Text } from 'react-konva'
import {
  CODE_BG,
  CODE_BLOCK_RADIUS,
  CODE_FONT_FAMILY,
  CODE_FONT_SIZE,
  CODE_LABEL_COLOR,
  CODE_LABEL_SIZE,
  CODE_LINE_HEIGHT,
  CODE_TEXT,
  PREVIEW_TEXT_COLOR,
  PREVIEW_TEXT_FONT_SIZE,
  PREVIEW_TEXT_LINE_HEIGHT,
  type MarkdownPreviewLayoutItem,
} from '../../utils/markdownCanvasLayout'

export function MarkdownCanvasPreviewItems({ items }: { items: MarkdownPreviewLayoutItem[] }) {
  return (
    <>
      {items.map((item, index) => {
        switch (item.type) {
          case 'text':
            return (
              <Text
                key={`preview-text-${index}`}
                x={item.x}
                y={item.y}
                width={item.width}
                height={item.height}
                text={item.text}
                fontFamily={item.fontFamily}
                fontSize={PREVIEW_TEXT_FONT_SIZE}
                lineHeight={PREVIEW_TEXT_LINE_HEIGHT}
                fill={PREVIEW_TEXT_COLOR}
                wrap="word"
                listening={false}
              />
            )
          case 'code-background':
            return (
              <Rect
                key={`preview-code-bg-${index}`}
                x={item.x}
                y={item.y}
                width={item.width}
                height={item.height}
                fill={CODE_BG}
                cornerRadius={CODE_BLOCK_RADIUS}
                listening={false}
              />
            )
          case 'code-label':
            return (
              <Text
                key={`preview-code-label-${index}`}
                x={item.x}
                y={item.y}
                text={item.text}
                fontFamily={CODE_FONT_FAMILY}
                fontSize={CODE_LABEL_SIZE}
                fill={CODE_LABEL_COLOR}
                listening={false}
              />
            )
          case 'code-text':
            return (
              <Text
                key={`preview-code-text-${index}`}
                x={item.x}
                y={item.y}
                width={item.width}
                height={item.height}
                text={item.text}
                fontFamily={CODE_FONT_FAMILY}
                fontSize={CODE_FONT_SIZE}
                lineHeight={CODE_LINE_HEIGHT}
                fill={CODE_TEXT}
                listening={false}
              />
            )
          default:
            return null
        }
      })}
    </>
  )
}

export function addMarkdownPreviewItemsToGroup(
  group: Konva.Group,
  KonvaNS: typeof Konva,
  items: MarkdownPreviewLayoutItem[],
) {
  for (const item of items) {
    switch (item.type) {
      case 'text':
        group.add(
          new KonvaNS.Text({
            x: item.x,
            y: item.y,
            width: item.width,
            height: item.height,
            text: item.text,
            fontFamily: item.fontFamily,
            fontSize: PREVIEW_TEXT_FONT_SIZE,
            lineHeight: PREVIEW_TEXT_LINE_HEIGHT,
            fill: PREVIEW_TEXT_COLOR,
            wrap: 'word',
          }),
        )
        break
      case 'code-background':
        group.add(
          new KonvaNS.Rect({
            x: item.x,
            y: item.y,
            width: item.width,
            height: item.height,
            fill: CODE_BG,
            cornerRadius: CODE_BLOCK_RADIUS,
          }),
        )
        break
      case 'code-label':
        group.add(
          new KonvaNS.Text({
            x: item.x,
            y: item.y,
            text: item.text,
            fontFamily: CODE_FONT_FAMILY,
            fontSize: CODE_LABEL_SIZE,
            fill: CODE_LABEL_COLOR,
          }),
        )
        break
      case 'code-text':
        group.add(
          new KonvaNS.Text({
            x: item.x,
            y: item.y,
            width: item.width,
            height: item.height,
            text: item.text,
            fontFamily: CODE_FONT_FAMILY,
            fontSize: CODE_FONT_SIZE,
            lineHeight: CODE_LINE_HEIGHT,
            fill: CODE_TEXT,
          }),
        )
        break
    }
  }
}
