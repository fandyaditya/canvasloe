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
        className={`absolute top-0 h-full transition-transform ease-out ${DURATION} ${
          isLeft ? 'left-0' : 'right-0'
        } ${open ? 'translate-x-0' : isLeft ? '-translate-x-full' : 'translate-x-full'}`}
        style={{ width }}
        aria-hidden={!open}
      >
        {children}
      </div>
      <div
        className={`absolute top-0 h-full w-10 transition-opacity ease-out ${DURATION} ${
          isLeft ? 'right-0' : 'left-0'
        } ${open ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
      >
        <SidebarRail side={side} />
      </div>
    </div>
  )
}
