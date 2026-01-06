'use client'

import { useState, useRef, useEffect } from 'react'

interface Image {
  id: string
  original_url: string
  thumbnail_url?: string
  is_primary?: boolean
}

interface ImageGalleryProps {
  images: Image[]
  itemName: string
}

export function ImageGallery({ images, itemName }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [scale, setScale] = useState(1)
  const [translateX, setTranslateX] = useState(0)
  const [translateY, setTranslateY] = useState(0)

  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartDistance = useRef(0)
  const touchStartScale = useRef(1)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const lastTouchX = useRef(0)
  const lastTouchY = useRef(0)
  const swipeStartX = useRef(0)
  const swipeStartY = useRef(0)

  const selectedImage = images[selectedIndex]

  // Reset zoom when image changes
  useEffect(() => {
    setScale(1)
    setTranslateX(0)
    setTranslateY(0)
  }, [selectedIndex])

  // Handle pinch-to-zoom and pan
  useEffect(() => {
    if (!isLightboxOpen || !containerRef.current) return

    const container = containerRef.current

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        // Pinch zoom start
        const touch1 = e.touches[0]
        const touch2 = e.touches[1]
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        )
        touchStartDistance.current = distance
        touchStartScale.current = scale
        e.preventDefault()
      } else if (e.touches.length === 1) {
        // Pan start or swipe start
        const touch = e.touches[0]
        if (scale > 1) {
          // Pan for zoomed image
          touchStartX.current = touch.clientX - translateX
          touchStartY.current = touch.clientY - translateY
        } else {
          // Swipe for navigation
          swipeStartX.current = touch.clientX
          swipeStartY.current = touch.clientY
        }
        lastTouchX.current = touch.clientX
        lastTouchY.current = touch.clientY
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        // Pinch zoom
        const touch1 = e.touches[0]
        const touch2 = e.touches[1]
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        )
        const newScale = (distance / touchStartDistance.current) * touchStartScale.current
        setScale(Math.max(1, Math.min(4, newScale)))
        e.preventDefault()
      } else if (e.touches.length === 1 && scale > 1) {
        // Pan zoomed image
        const touch = e.touches[0]
        setTranslateX(touch.clientX - touchStartX.current)
        setTranslateY(touch.clientY - touchStartY.current)
        e.preventDefault()
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        // Check for swipe navigation
        if (scale === 1 && images.length > 1) {
          const deltaX = lastTouchX.current - swipeStartX.current
          const deltaY = Math.abs(lastTouchY.current - swipeStartY.current)

          // Horizontal swipe with minimal vertical movement
          if (Math.abs(deltaX) > 50 && deltaY < 30) {
            if (deltaX > 0) {
              // Swipe right - previous image
              setSelectedIndex(prev => prev === 0 ? images.length - 1 : prev - 1)
            } else {
              // Swipe left - next image
              setSelectedIndex(prev => prev === images.length - 1 ? 0 : prev + 1)
            }
          }
        }
      }
    }

    container.addEventListener('touchstart', handleTouchStart, { passive: false })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd, { passive: false })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isLightboxOpen, scale, translateX, translateY, images.length])

  const handleDoubleClick = () => {
    if (scale === 1) {
      setScale(2)
    } else {
      setScale(1)
      setTranslateX(0)
      setTranslateY(0)
    }
  }

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
        <span className="text-6xl text-slate-300 dark:text-slate-600">📷</span>
      </div>
    )
  }

  return (
    <>
      {/* Main Image */}
      <div
        className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden mb-4 cursor-pointer relative group"
        onClick={() => setIsLightboxOpen(true)}
      >
        <img
          src={selectedImage.original_url}
          alt={itemName}
          className="w-full h-full object-contain"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white bg-black/50 px-4 py-2 rounded-lg">
            Vergrößern
          </span>
        </div>

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/60 text-white text-sm px-3 py-1 rounded-full">
            {selectedIndex + 1} / {images.length}
          </div>
        )}

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setSelectedIndex(prev => prev === 0 ? images.length - 1 : prev - 1)
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 dark:bg-slate-800/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-slate-700"
              aria-label="Vorheriges Bild"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setSelectedIndex(prev => prev === images.length - 1 ? 0 : prev + 1)
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 dark:bg-slate-800/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-slate-700"
              aria-label="Nächstes Bild"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {images.map((img, index) => (
            <button
              key={img.id}
              onClick={() => setSelectedIndex(index)}
              className={`w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                index === selectedIndex
                  ? 'border-blue-500 ring-2 ring-blue-500/30'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500'
              }`}
            >
              <img
                src={img.thumbnail_url ?? img.original_url}
                alt=""
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {isLightboxOpen && (
        <div
          ref={containerRef}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center overflow-hidden"
          onClick={() => {
            if (scale === 1) {
              setIsLightboxOpen(false)
            }
          }}
        >
          {/* Close Button */}
          <button
            onClick={() => {
              setIsLightboxOpen(false)
              setScale(1)
              setTranslateX(0)
              setTranslateY(0)
            }}
            className="absolute top-4 right-4 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Zoom Indicator */}
          {scale > 1 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/20 text-white text-sm px-3 py-1 rounded-full z-10">
              {Math.round(scale * 100)}%
            </div>
          )}

          {/* Counter */}
          {images.length > 1 && (
            <div className="absolute top-4 left-4 text-white text-lg z-10">
              {selectedIndex + 1} / {images.length}
            </div>
          )}

          {/* Main Image */}
          <img
            ref={imageRef}
            src={selectedImage.original_url}
            alt={itemName}
            className="max-w-[90vw] max-h-[90vh] object-contain transition-transform touch-none select-none"
            style={{
              transform: `scale(${scale}) translate(${translateX / scale}px, ${translateY / scale}px)`,
              cursor: scale > 1 ? 'move' : 'zoom-in'
            }}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={handleDoubleClick}
          />

          {/* Navigation */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedIndex(prev => prev === 0 ? images.length - 1 : prev - 1)
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedIndex(prev => prev === images.length - 1 ? 0 : prev + 1)
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Thumbnails in Lightbox */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 p-2 rounded-lg">
              {images.map((img, index) => (
                <button
                  key={img.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedIndex(index)
                  }}
                  className={`w-16 h-16 flex-shrink-0 rounded overflow-hidden border-2 transition-all ${
                    index === selectedIndex
                      ? 'border-white'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img.thumbnail_url ?? img.original_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
