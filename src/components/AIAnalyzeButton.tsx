'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface AIAnalysisResult {
  name?: string
  description?: string
  category?: string
  estimatedValue?: {
    min: number
    max: number
    currency: string
  }
  attributes?: Record<string, any>
  confidence?: number
}

interface AIAnalyzeButtonProps {
  imageUrl: string
  imageFile?: File
  collectionType?: string
  existingAttributes?: string[]
  onResult: (result: AIAnalysisResult) => void
  disabled?: boolean
}

export function AIAnalyzeButton({
  imageUrl,
  imageFile,
  collectionType,
  existingAttributes,
  onResult,
  disabled
}: AIAnalyzeButtonProps) {
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  async function handleAnalyze() {
    setAnalyzing(true)
    setError(null)

    try {
      // Bild zu Base64 konvertieren
      let base64: string

      if (imageFile) {
        // Lokale Datei
        base64 = await fileToBase64(imageFile)
      } else {
        // URL - Bild laden und konvertieren
        const response = await fetch(imageUrl)
        const blob = await response.blob()
        base64 = await blobToBase64(blob)
      }

      // Supabase Edge Function aufrufen
      const { data, error: fnError } = await supabase.functions.invoke('analyze-image', {
        body: {
          imageBase64: base64,
          collectionType,
          existingAttributes,
        },
      })

      if (fnError) {
        throw new Error(fnError.message)
      }

      if (data.error) {
        throw new Error(data.error)
      }

      onResult(data)
    } catch (err: any) {
      console.error('AI Analysis error:', err)
      setError(err.message || 'Analyse fehlgeschlagen')
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleAnalyze}
        disabled={disabled || analyzing}
        className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
      >
        {analyzing ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Analysiere...</span>
          </>
        ) : (
          <>
            <span>✨</span>
            <span>KI ausfüllen</span>
          </>
        )}
      </button>

      {error && (
        <div className="absolute top-full left-0 mt-2 p-2 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 text-xs rounded-lg whitespace-nowrap z-10">
          {error}
        </div>
      )}
    </div>
  )
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
