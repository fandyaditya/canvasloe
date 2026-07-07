import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type MarkdownPreviewProps = {
  markdown: string
  fontFamily?: string
  textColor?: string
  backgroundColor?: string
  padding?: number
  radius?: number
  className?: string
}

export function MarkdownPreview({
  markdown,
  fontFamily = 'Inter',
  textColor = '#111827',
  backgroundColor = '#FFFFFF',
  padding = 16,
  radius = 12,
  className = '',
}: MarkdownPreviewProps) {
  return (
    <div
      className={`markdown-preview overflow-y-auto text-sm ${className}`}
      style={{
        fontFamily,
        color: textColor,
        backgroundColor,
        padding,
        borderRadius: radius,
      }}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  )
}
