import { useEffect, useState } from 'react'

type InlineEditableProps = {
  value: string
  onSave: (value: string) => void
  className?: string
  inputClassName?: string
  placeholder?: string
}

export function InlineEditable({
  value,
  onSave,
  className = '',
  inputClassName = '',
  placeholder = 'Untitled',
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
      role="button"
      tabIndex={0}
      title="Click to rename"
      onClick={(e) => {
        e.stopPropagation()
        setEditing(true)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          e.stopPropagation()
          setEditing(true)
        }
      }}
      className={`cursor-text ${className}`}
    >
      {value || placeholder}
    </span>
  )
}
