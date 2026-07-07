import { useId } from 'react'

function toPickerColor(color: string): string {
  if (/^#[0-9A-Fa-f]{6}$/.test(color)) return color
  if (/^#[0-9A-Fa-f]{3}$/.test(color)) {
    const [, r, g, b] = color.match(/^#(.)(.)(.)$/)!
    return `#${r}${r}${g}${g}${b}${b}`
  }
  return '#000000'
}

const CHECKERBOARD =
  'bg-[linear-gradient(45deg,#ccc_25%,transparent_25%,transparent_75%,#ccc_75%,#ccc),linear-gradient(45deg,#ccc_25%,transparent_25%,transparent_75%,#ccc_75%,#ccc)] bg-size-[8px_8px] bg-position-[0_0,4px_4px]'

export function ColorField({
  color,
  opacity = 100,
  onColorChange,
  onOpacityChange,
}: {
  color: string
  opacity?: number
  onColorChange: (color: string) => void
  onOpacityChange?: (opacity: number) => void
}) {
  const inputId = useId()
  const isTransparent = color === 'transparent'
  const pickerColor = toPickerColor(color)

  return (
    <div className="flex items-center gap-2">
      <div className="relative h-9 w-9 shrink-0">
        <label
          htmlFor={inputId}
          title="Pick color"
          className={`relative block h-9 w-9 cursor-pointer overflow-hidden rounded-lg border border-panel-border ${isTransparent ? CHECKERBOARD : ''}`}
          style={isTransparent ? undefined : { backgroundColor: color }}
        />
        <input
          id={inputId}
          type="color"
          value={pickerColor}
          onChange={(e) => onColorChange(e.target.value)}
          className="sr-only"
        />
      </div>
      <input
        type="text"
        value={isTransparent ? 'TRANSPARENT' : color.toUpperCase()}
        onChange={(e) => {
          const value = e.target.value
          if (value.toUpperCase() === 'TRANSPARENT') {
            onColorChange('transparent')
            return
          }
          onColorChange(value)
        }}
        className="h-9 flex-1 rounded-lg border border-panel-border px-3 text-sm uppercase"
      />
      {onOpacityChange && (
        <select
          value={opacity}
          onChange={(e) => onOpacityChange(Number(e.target.value))}
          className="h-9 w-16 rounded-lg border border-panel-border px-2 text-sm"
        >
          {[100, 75, 50, 25, 0].map((v) => (
            <option key={v} value={v}>
              {v}%
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
