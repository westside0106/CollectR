'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ImageUploadProps {
  itemId?: string
  existingImages?: { id: string; original_url: string; is_primary: boolean }[]
  onImagesChange?: (images: { url: string; file?: File }[]) => void
}

export function ImageUpload({ itemId, existingImages = [], onImagesChange }: ImageUploadProps) {
  const [images, setImages] = useState<{ url: string; file?: File; id?: string }[]>(
    existingImages.map(img => ({ url: img.original_url, id: img.id }))
  )
  const [uploading, setUploading] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files?.length) return

    setUploading(true)
    const newImages: { url: string; file?: File }[] = []

    for (const file of Array.from(files)) {
      // Für neue Items: nur Preview zeigen, Upload später
      if (!itemId) {
        const previewUrl = URL.createObjectURL(file)
        newImages.push({ url: previewUrl, file })
      } else {
        // Für existierende Items: direkt hochladen
        const fileName = `${itemId}/${Date.now()}-${file.name}`

        const { data, error } = await supabase.storage
          .from('item-images')
          .upload(fileName, file)

        if (!error && data) {
          const { data: urlData } = supabase.storage
            .from('item-images')
            .getPublicUrl(data.path)

          // In DB speichern
          await supabase.from('item_images').insert({
            item_id: itemId,
            original_url: urlData.publicUrl,
            is_primary: images.length === 0 && newImages.length === 0,
          })

          newImages.push({ url: urlData.publicUrl })
        }
      }
    }

    const updatedImages = [...images, ...newImages]
    setImages(updatedImages)
    onImagesChange?.(updatedImages)
    setUploading(false)

    // Input zurücksetzen
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  async function removeImage(index: number) {
    const img = images[index]

    // Aus DB löschen wenn vorhanden
    if (img.id) {
      await supabase.from('item_images').delete().eq('id', img.id)
    }

    const updatedImages = images.filter((_, i) => i !== index)
    setImages(updatedImages)
    onImagesChange?.(updatedImages)
  }

  // Drag & Drop für Neuordnung
  function handleDragStart(index: number) {
    setDraggedIndex(index)
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newImages = [...images]
    const draggedItem = newImages[draggedIndex]
    newImages.splice(draggedIndex, 1)
    newImages.splice(index, 0, draggedItem)

    setImages(newImages)
    setDraggedIndex(index)
  }

  async function handleDragEnd() {
    setDraggedIndex(null)

    // Update sort order in DB if we have IDs
    if (itemId) {
      for (let i = 0; i < images.length; i++) {
        const img = images[i]
        if (img.id) {
          await supabase
            .from('item_images')
            .update({ is_primary: i === 0, sort_order: i })
            .eq('id', img.id)
        }
      }
    }

    onImagesChange?.(images)
  }

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
        Bilder
      </label>

      {/* Image Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
        {images.map((img, index) => (
          <div
            key={img.id || index}
            className={`relative aspect-square group cursor-move ${
              draggedIndex === index ? 'opacity-50' : ''
            }`}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
          >
            <img
              src={img.url}
              alt=""
              className="w-full h-full object-cover rounded-lg border border-slate-200 dark:border-slate-600"
            />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-sm hover:bg-red-600"
            >
              ✕
            </button>
            {index === 0 && (
              <span className="absolute bottom-1 left-1 px-2 py-0.5 bg-blue-600 text-white text-xs rounded">
                Hauptbild
              </span>
            )}
            {/* Drag handle indicator */}
            <div className="absolute top-1 left-1 w-5 h-5 bg-black/30 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
              </svg>
            </div>
          </div>
        ))}

        {/* Upload Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="aspect-square border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex flex-col items-center justify-center gap-1 disabled:opacity-50"
        >
          {uploading ? (
            <span className="text-slate-400 dark:text-slate-500 animate-pulse">...</span>
          ) : (
            <>
              <span className="text-2xl">📷</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Hinzufügen</span>
            </>
          )}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      <p className="text-xs text-slate-400 dark:text-slate-500">
        Klicke auf + um Bilder hinzuzufügen. Das erste Bild wird als Hauptbild verwendet. Ziehe Bilder um die Reihenfolge zu ändern.
      </p>
    </div>
  )
}
