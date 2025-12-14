'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function NewCollectionPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  // User ID beim Laden holen
  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      } else {
        // Nicht eingeloggt -> Login
        router.push('/login')
      }
    }
    getUser()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) {
      setError('Nicht eingeloggt')
      return
    }
    
    setLoading(true)
    setError(null)

    const { data, error: insertError } = await supabase
      .from('collections')
      .insert({
        name,
        description: description || null,
        owner_id: userId,  // <-- WICHTIG: owner_id mitsenden!
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push(`/collections/${data.id}`)
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <Link 
          href="/collections"
          className="text-slate-500 hover:text-slate-700 text-sm flex items-center gap-1 mb-2"
        >
          ← Zurück zu Sammlungen
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">Neue Sammlung</h1>
        <p className="text-slate-500 mt-1">Erstelle eine neue Sammlung für deine Items</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
        <div className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
              Name *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="z.B. Hot Wheels Sammlung"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">
              Beschreibung
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Optional: Beschreibe deine Sammlung..."
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading || !userId}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Erstelle...' : 'Sammlung erstellen'}
            </button>
            <Link
              href="/collections"
              className="px-6 py-3 rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors text-center"
            >
              Abbrechen
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}
