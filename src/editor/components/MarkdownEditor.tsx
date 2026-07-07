const LINE_HEIGHT_PX = 20
const EDITOR_PADDING_Y_PX = 8

export function MarkdownEditor({
  value,
  onChange,
  minLines = 4,
  className = '',
}: {
  value: string
  onChange: (value: string) => void
  minLines?: number
  className?: string
}) {
  const lineCount = Math.max(minLines, value.split('\n').length)
  const contentHeight = lineCount * LINE_HEIGHT_PX

  return (
    <div className={`flex overflow-hidden rounded-lg border border-panel-border bg-white ${className}`}>
      <div
        className="shrink-0 select-none border-r border-panel-border bg-gray-50 px-2 text-right font-mono text-xs text-text-secondary"
        style={{
          paddingTop: EDITOR_PADDING_Y_PX,
          paddingBottom: EDITOR_PADDING_Y_PX,
          lineHeight: `${LINE_HEIGHT_PX}px`,
          height: contentHeight + EDITOR_PADDING_Y_PX * 2,
        }}
        aria-hidden
      >
        {Array.from({ length: lineCount }, (_, i) => (
          <div key={i} style={{ height: LINE_HEIGHT_PX }}>
            {i + 1}
          </div>
        ))}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className="w-full resize-none bg-white px-3 font-mono text-sm text-text-primary outline-none"
        style={{
          paddingTop: EDITOR_PADDING_Y_PX,
          paddingBottom: EDITOR_PADDING_Y_PX,
          lineHeight: `${LINE_HEIGHT_PX}px`,
          height: contentHeight + EDITOR_PADDING_Y_PX * 2,
        }}
      />
    </div>
  )
}
