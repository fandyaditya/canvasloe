import { useEffect, useState, type SyntheticEvent } from 'react'

type InlineEditableProps = {
  value: string
  onSave: (value: string) => void
  className?: string
  inputClassName?: string
  placeholder?: string
  openOn?: 'click' | 'doubleClick'
  title?: string
  onActivate?: () => void
}

export function InlineEditable({
  value,
  onSave,
  className = '',
  inputClassName = '',
  placeholder = 'Untitled',
  openOn = 'click',
  title,
  onActivate,
}: InlineEditableProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    setDraft(value)
  }, [value])

  const commit = () => {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== value) onSave(trimmed)
    else setDraft(value)
    setEditing(false)
  }

  const startEditing = (e: SyntheticEvent) => {
    e.stopPropagation()
    setEditing(true)
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') {
            setDraft(value)
            setEditing(false)
          }
        }}
        onClick={(e) => e.stopPropagation()}
        className={inputClassName}
      />
    )
  }

  return (
    <span
      role={openOn === 'click' ? 'button' : undefined}
      tabIndex={openOn === 'click' ? 0 : undefined}
      title={title ?? (openOn === 'doubleClick' ? 'Double-click to rename' : 'Click to rename')}
      onClick={
        openOn === 'click'
          ? startEditing
          : onActivate
            ? (e) => {
                e.stopPropagation()
                onActivate()
              }
            : undefined
      }
      onDoubleClick={openOn === 'doubleClick' ? startEditing : undefined}
      onKeyDown={
        openOn === 'click'
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                e.stopPropagation()
                setEditing(true)
              }
            }
          : undefined
      }
      className={`${openOn === 'click' || onActivate ? 'cursor-pointer' : ''} ${className}`}
    >
      {value || placeholder}
    </span>
  )
}
