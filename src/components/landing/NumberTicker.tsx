'use client'

import { useEffect, useRef } from 'react'
import { useInView, useMotionValue, useSpring } from 'framer-motion'

interface NumberTickerProps {
  value: number
  direction?: 'up' | 'down'
  delay?: number
  className?: string
  suffix?: string
  prefix?: string
}

export function NumberTicker({
  value,
  direction = 'up',
  delay = 0,
  className = '',
  suffix = '',
  prefix = '',
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const motionValue = useMotionValue(direction === 'down' ? value : 0)
  const springValue = useSpring(motionValue, {
    damping: 60,
    stiffness: 100,
  })
  const isInView = useInView(ref, { once: true, margin: '0px' })

  useEffect(() => {
    if (isInView) {
      const timer = setTimeout(() => {
        motionValue.set(direction === 'down' ? 0 : value)
      }, delay * 1000)
      return () => clearTimeout(timer)
    }
  }, [motionValue, isInView, delay, value, direction])

  useEffect(() => {
    return springValue.on('change', (latest) => {
      if (ref.current) {
        ref.current.textContent =
          prefix +
          Intl.NumberFormat('de-DE').format(Math.round(latest)) +
          suffix
      }
    })
  }, [springValue, suffix, prefix])

  return (
    <span ref={ref} className={className}>
      {prefix}0{suffix}
    </span>
  )
}
