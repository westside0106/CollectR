'use client'

import { useId } from 'react'

interface AuroraProps {
  colorStops?: string[]
  amplitude?: number
  blend?: number
  className?: string
}

export function Aurora({
  colorStops = ['#4785ff', '#8061ff', '#5227ff', '#93e3fd', '#ffffff'],
  amplitude = 0.4,
  blend = 0.2,
  className = ''
}: AuroraProps) {
  // Generate unique IDs for gradients to avoid conflicts when multiple Aurora components exist
  const uniqueId = useId()
  const gradient1Id = `aurora-gradient-1-${uniqueId}`
  const gradient2Id = `aurora-gradient-2-${uniqueId}`

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      <svg
        className="absolute w-full h-full"
        style={{ filter: `blur(40px) brightness(1.2)` }}
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id={gradient1Id} x1="0%" y1="0%" x2="100%" y2="100%">
            {colorStops.map((color, i) => (
              <stop
                key={i}
                offset={`${(i / (colorStops.length - 1)) * 100}%`}
                stopColor={color}
                stopOpacity={amplitude}
              >
                <animate
                  attributeName="stop-color"
                  values={`${color};${colorStops[(i + 1) % colorStops.length]};${color}`}
                  dur="8s"
                  repeatCount="indefinite"
                />
              </stop>
            ))}
          </linearGradient>
          <linearGradient id={gradient2Id} x1="100%" y1="0%" x2="0%" y2="100%">
            {colorStops.map((color, i) => (
              <stop
                key={i}
                offset={`${(i / (colorStops.length - 1)) * 100}%`}
                stopColor={color}
                stopOpacity={amplitude * 0.8}
              >
                <animate
                  attributeName="stop-color"
                  values={`${colorStops[(i + 2) % colorStops.length]};${color};${colorStops[(i + 2) % colorStops.length]}`}
                  dur="10s"
                  repeatCount="indefinite"
                />
              </stop>
            ))}
          </linearGradient>
        </defs>

        <ellipse cx="200" cy="200" rx="400" ry="300" fill={`url(#${gradient1Id})`} opacity={blend}>
          <animate attributeName="cx" values="200;800;200" dur="20s" repeatCount="indefinite" />
          <animate attributeName="cy" values="200;600;200" dur="15s" repeatCount="indefinite" />
        </ellipse>

        <ellipse cx="800" cy="800" rx="500" ry="400" fill={`url(#${gradient2Id})`} opacity={blend}>
          <animate attributeName="cx" values="800;200;800" dur="25s" repeatCount="indefinite" />
          <animate attributeName="cy" values="800;300;800" dur="18s" repeatCount="indefinite" />
        </ellipse>

        <ellipse cx="500" cy="500" rx="350" ry="350" fill={`url(#${gradient1Id})`} opacity={blend * 0.6}>
          <animate attributeName="rx" values="350;500;350" dur="12s" repeatCount="indefinite" />
          <animate attributeName="ry" values="350;250;350" dur="10s" repeatCount="indefinite" />
        </ellipse>
      </svg>
    </div>
  )
}
