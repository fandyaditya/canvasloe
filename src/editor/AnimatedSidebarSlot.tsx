import type { ReactNode } from 'react'
import { SidebarRail } from './SidebarRail'

const RAIL_WIDTH = 40
const DURATION = 'duration-[250ms]'

type AnimatedSidebarSlotProps = {
  side: 'left' | 'right'
  open: boolean
  width: number
  children: ReactNode
}

export function AnimatedSidebarSlot({ side, open, width, children }: AnimatedSidebarSlotProps) {
  const isLeft = side === 'left'

  return (
    <div
      className={`relative h-full shrink-0 overflow-hidden transition-[width] ease-out ${DURATION} ${
        isLeft ? 'border-r border-panel-border' : 'border-l border-panel-border'
      }`}
      style={{ width: open ? width : RAIL_WIDTH }}
    >
      <div
        className={`absolute top-0 h-full transition-opacity ease-out ${DURATION} ${
          isLeft ? 'left-0' : 'right-0'
        } ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        style={{ width }}
        aria-hidden={!open}
      >
        {children}
      </div>

      {!open && (
        <div
          className={`absolute top-0 z-10 h-full w-10 ${
            isLeft ? 'right-0' : 'left-0'
          }`}
        >
          <SidebarRail side={side} />
        </div>
      )}
    </div>
  )
}
