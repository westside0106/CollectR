'use client'

import { useState } from 'react'

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

  const selectedImage = images[selectedIndex]

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
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setSelectedIndex(prev => prev === images.length - 1 ? 0 : prev + 1)
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 dark:bg-slate-800/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-slate-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Close Button */}
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Counter */}
          {images.length > 1 && (
            <div className="absolute top-4 left-4 text-white text-lg">
              {selectedIndex + 1} / {images.length}
            </div>
          )}

          {/* Main Image */}
          <img
            src={selectedImage.original_url}
            alt={itemName}
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
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
