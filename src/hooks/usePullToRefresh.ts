'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>
  threshold?: number
  refreshingDelay?: number
}

export function usePullToRefresh({
  onRefresh,
  threshold = 150,
  refreshingDelay = 500
}: UsePullToRefreshOptions) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)

  // Use refs for all touch tracking to avoid stale closures and
  // re-registering listeners on every state change
  const touchStartY = useRef(0)
  const touchStartX = useRef(0)
  const isRefreshingRef = useRef(false)
  const pullDistanceRef = useRef(0)
  const isTrackingRef = useRef(false)

  const handleRefresh = useCallback(async () => {
    if (isRefreshingRef.current) return
    isRefreshingRef.current = true
    setIsRefreshing(true)
    setPullDistance(0)
    pullDistanceRef.current = 0

    try {
      await onRefresh()
    } finally {
      setTimeout(() => {
        isRefreshingRef.current = false
        setIsRefreshing(false)
      }, refreshingDelay)
    }
  }, [onRefresh, refreshingDelay])

  useEffect(() => {
    if (!('ontouchstart' in window)) return

    const handleTouchStart = (e: TouchEvent) => {
      // Only start tracking when truly at the top of the page
      if (window.scrollY > 5 || isRefreshingRef.current) return

      touchStartY.current = e.touches[0].clientY
      touchStartX.current = e.touches[0].clientX
      isTrackingRef.current = true
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isTrackingRef.current || isRefreshingRef.current) return

      const touchY = e.touches[0].clientY
      const touchX = e.touches[0].clientX
      const deltaY = touchY - touchStartY.current
      const deltaX = Math.abs(touchX - touchStartX.current)

      // Cancel if gesture is too horizontal (e.g. swiping sideways)
      if (deltaX > deltaY * 0.6 && deltaY < 30) {
        isTrackingRef.current = false
        return
      }

      // Cancel if user is scrolling up or not moving down
      if (deltaY <= 0) {
        isTrackingRef.current = false
        setPullDistance(0)
        pullDistanceRef.current = 0
        return
      }

      // Stop tracking if user scrolled away from top during the gesture
      if (window.scrollY > 5) {
        isTrackingRef.current = false
        setPullDistance(0)
        pullDistanceRef.current = 0
        return
      }

      // Dead zone: first 40px of pull don't show indicator (feels intentional)
      const DEAD_ZONE = 40
      const effective = Math.max(0, deltaY - DEAD_ZONE)
      // Apply rubber-band resistance: pull gets harder the further you go
      const resistance = Math.sqrt(effective) * 4
      const clamped = Math.min(resistance, threshold * 1.2)

      pullDistanceRef.current = clamped
      setPullDistance(clamped)

      // Only prevent default scrolling once the user clearly intends to pull
      if (deltaY > DEAD_ZONE) {
        e.preventDefault()
      }
    }

    const handleTouchEnd = () => {
      if (!isTrackingRef.current) return
      isTrackingRef.current = false
      touchStartY.current = 0
      touchStartX.current = 0

      if (pullDistanceRef.current >= threshold && !isRefreshingRef.current) {
        handleRefresh()
      } else {
        setPullDistance(0)
        pullDistanceRef.current = 0
      }
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })
    document.addEventListener('touchcancel', handleTouchEnd, { passive: true })

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
      document.removeEventListener('touchcancel', handleTouchEnd)
    }
  }, [handleRefresh, threshold])

  const isPulling = pullDistance > 0
  const shouldRefresh = pullDistance >= threshold

  return {
    isRefreshing,
    isPulling,
    pullDistance,
    shouldRefresh
  }
}
