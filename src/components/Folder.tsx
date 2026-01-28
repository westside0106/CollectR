'use client'

import { useState } from 'react'

interface FolderProps {
  color?: string
  size?: number
  items?: React.ReactNode[]
  className?: string
  onClick?: () => void
}

const darkenColor = (hex: string, percent: number) => {
  let color = hex.startsWith('#') ? hex.slice(1) : hex
  if (color.length === 3) {
    color = color
      .split('')
      .map(c => c + c)
      .join('')
  }
  const num = parseInt(color, 16)
  let r = (num >> 16) & 0xff
  let g = (num >> 8) & 0xff
  let b = num & 0xff

  r = Math.max(0, Math.min(255, Math.floor(r * (1 - percent))))
  g = Math.max(0, Math.min(255, Math.floor(g * (1 - percent))))
  b = Math.max(0, Math.min(255, Math.floor(b * (1 - percent))))

  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()
}

export function Folder({
  color = '#5227FF',
  size = 1,
  items = [],
  className = '',
  onClick
}: FolderProps) {
  const [open, setOpen] = useState(false)
  const [paperOffsets, setPaperOffsets] = useState<Array<{ x: number; y: number }>>(
    Array.from({ length: Math.min(items.length, 3) }, () => ({ x: 0, y: 0 }))
  )

  const folderBackColor = darkenColor(color, 0.08)
  const paper1 = darkenColor('#ffffff', 0.1)
  const paper2 = darkenColor('#ffffff', 0.05)
  const paper3 = '#ffffff'

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      setOpen(prev => !prev)
      if (!open) {
        setPaperOffsets(Array.from({ length: Math.min(items.length, 3) }, (_, i) => ({
          x: (i * 0.15) * 100,
          y: 0
        })))
      } else {
        setPaperOffsets(prev => prev.map(() => ({ x: 0, y: 0 })))
      }
    }
  }

  const scaleStyle = { transform: `scale(${size})` }

  return (
    <div
      style={scaleStyle}
      className={`relative inline-block ${className}`}
      onClick={handleClick}
    >
      <div className="relative w-24 h-20 transition-all duration-200 ease-in-out cursor-pointer">
        {/* Papers flying out */}
        <div className="absolute z-[2] bottom-2.5 left-[50%] translate-x-[-50%]">
          {items.slice(0, 3).map((item, i) => (
            <div
              key={i}
              className={`absolute w-[70px] h-20 rounded-[10px] transition-all duration-300 ease-in-out ${
                open ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                background: i === 0 ? paper1 : i === 1 ? paper2 : paper3,
                bottom: '10%',
                left: '50%',
                transform: open
                  ? `translate(${-120 - i * 15}%, ${-70 - i * 10}%) rotateZ(${-15 - i * 5}deg)`
                  : `translate(-50%, 0%) rotateZ(0deg)`,
                zIndex: 2 - i
              }}
            >
              <div className="flex items-center justify-center h-full text-xs overflow-hidden p-2">
                {item}
              </div>
            </div>
          ))}
        </div>

        {/* Folder back */}
        <div
          className="absolute w-full h-20 rounded-[10px_10px_10px_10px] transition-all duration-300 ease-in-out"
          style={{
            background: folderBackColor,
            position: 'relative',
            zIndex: 0,
            width: '100px',
            height: '80px'
          }}
        >
          {/* Pseudo-element for after */}
          <div
            className="absolute z-0 bottom-[98%] left-0 w-[30px] h-2.5 rounded-[5px_5px_0_0]"
            style={{
              background: folderBackColor,
              content: '""'
            }}
          />
        </div>

        {/* Folder front */}
        <div
          className="absolute w-full h-full rounded-[10px_10px_10px_10px] transition-all duration-300 ease-in-out"
          style={{
            position: 'absolute',
            zIndex: 3,
            width: '100%',
            height: '100%',
            background: color,
            transformOrigin: 'bottom',
            transform: open ? 'translateY(-8px)' : 'translateY(0)',
            borderRadius: '5px 10px 10px 10px'
          }}
        />

        {/* Right side */}
        <div
          className="absolute z-[1] transition-all duration-300 ease-in-out"
          style={{
            width: '100%',
            height: '100%',
            background: color,
            position: 'absolute',
            transform: open ? 'skew(-15deg) scale(0.6)' : 'skew(-15deg) scale(0.6)',
            transformOrigin: 'bottom',
            right: '-15%',
            borderRadius: '5px 10px 10px 10px'
          }}
        />
      </div>
    </div>
  )
}
