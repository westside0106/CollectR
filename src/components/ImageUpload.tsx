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

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        Bilder
      </label>
      
      {/* Image Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
        {images.map((img, index) => (
          <div key={index} className="relative aspect-square group">
            <img 
              src={img.url}
              alt=""
              className="w-full h-full object-cover rounded-lg border border-slate-200"
            />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-sm"
            >
              ✕
            </button>
            {index === 0 && (
              <span className="absolute bottom-1 left-1 px-2 py-0.5 bg-blue-600 text-white text-xs rounded">
                Hauptbild
              </span>
            )}
          </div>
        ))}
        
        {/* Upload Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="aspect-square border-2 border-dashed border-slate-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors flex flex-col items-center justify-center gap-1 disabled:opacity-50"
        >
          {uploading ? (
            <span className="text-slate-400">...</span>
          ) : (
            <>
              <span className="text-2xl">📷</span>
              <span className="text-xs text-slate-500">Hinzufügen</span>
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
      
      <p className="text-xs text-slate-400">
        Klicke auf + um Bilder hinzuzufügen. Das erste Bild wird als Hauptbild verwendet.
      </p>
    </div>
  )
}
