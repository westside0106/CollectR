'use client'

import { useEffect, useRef, useState } from 'react'

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>
  threshold?: number
  refreshingDelay?: number
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  refreshingDelay = 500
}: UsePullToRefreshOptions) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const touchStartY = useRef(0)
  const scrollElement = useRef<HTMLElement | null>(null)

  useEffect(() => {
    // Only enable on mobile/touch devices
    if (!('ontouchstart' in window)) return

    const handleTouchStart = (e: TouchEvent) => {
      // Only trigger if at top of page
      const target = e.target as HTMLElement
      scrollElement.current = target.closest('[data-pull-refresh]') as HTMLElement

      if (!scrollElement.current) {
        scrollElement.current = document.scrollingElement as HTMLElement || document.documentElement
      }

      if (scrollElement.current.scrollTop === 0) {
        touchStartY.current = e.touches[0].clientY
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (isRefreshing || touchStartY.current === 0) return

      const touchY = e.touches[0].clientY
      const distance = touchY - touchStartY.current

      // Only pull down
      if (distance > 0 && scrollElement.current?.scrollTop === 0) {
        setPullDistance(Math.min(distance, threshold * 1.5))

        // Prevent native pull-to-refresh on some browsers
        if (distance > 10) {
          e.preventDefault()
        }
      }
    }

    const handleTouchEnd = async () => {
      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true)
        setPullDistance(0)

        try {
          await onRefresh()
        } finally {
          // Small delay for visual feedback
          setTimeout(() => {
            setIsRefreshing(false)
          }, refreshingDelay)
        }
      } else {
        setPullDistance(0)
      }

      touchStartY.current = 0
      scrollElement.current = null
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isRefreshing, pullDistance, threshold, onRefresh, refreshingDelay])

  const isPulling = pullDistance > 0
  const shouldRefresh = pullDistance >= threshold

  return {
    isRefreshing,
    isPulling,
    pullDistance,
    shouldRefresh
  }
}
