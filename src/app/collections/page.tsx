'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Collection {
  id: string
  name: string
  description: string | null
  item_count?: number
}

interface EditModalProps {
  collection: Collection
  onClose: () => void
  onSave: (id: string, name: string, description: string) => Promise<void>
}

function EditModal({ collection, onClose, onSave }: EditModalProps) {
  const [name, setName] = useState(collection.name)
  const [description, setDescription] = useState(collection.description || '')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    await onSave(collection.id, name.trim(), description.trim())
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4">Sammlung bearbeiten</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="z.B. Hot Wheels Sammlung"
              required
              autoFocus
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={3}
              placeholder="Optional: Beschreibe deine Sammlung..."
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
            >
              {saving ? 'Speichern...' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface DeleteModalProps {
  collection: Collection
  onClose: () => void
  onDelete: (id: string) => Promise<void>
}

function DeleteModal({ collection, onClose, onDelete }: DeleteModalProps) {
  const [deleting, setDeleting] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const needsConfirm = (collection.item_count || 0) > 0

  async function handleDelete() {
    if (needsConfirm && confirmText !== collection.name) return
    setDeleting(true)
    await onDelete(collection.id)
    setDeleting(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-2 text-red-600">Sammlung löschen</h2>
        <p className="text-gray-600 mb-4">
          Möchtest du <strong>"{collection.name}"</strong> wirklich löschen?
        </p>

        {needsConfirm ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800 text-sm mb-3">
              Diese Sammlung enthält <strong>{collection.item_count} Item(s)</strong>.
              Alle Items werden unwiderruflich gelöscht!
            </p>
            <label className="block text-sm font-medium text-red-800 mb-1">
              Tippe "{collection.name}" zur Bestätigung:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder={collection.name}
            />
          </div>
        ) : (
          <p className="text-gray-500 text-sm mb-4">
            Diese Sammlung ist leer und kann sicher gelöscht werden.
          </p>
        )}

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
          >
            Abbrechen
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting || (needsConfirm && confirmText !== collection.name)}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50"
          >
            {deleting ? 'Löschen...' : 'Endgültig löschen'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CollectionsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [editCollection, setEditCollection] = useState<Collection | null>(null)
  const [deleteCollection, setDeleteCollection] = useState<Collection | null>(null)

  useEffect(() => {
    loadCollections()
  }, [])

  async function loadCollections() {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    // Collections mit Item-Count laden
    const { data, error } = await supabase
      .from('collections')
      .select(`
        id,
        name,
        description,
        items(count)
      `)
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })

    if (data) {
      const collectionsWithCount = data.map(c => ({
        id: c.id,
        name: c.name,
        description: c.description,
        item_count: (c.items as any)?.[0]?.count || 0
      }))
      setCollections(collectionsWithCount)
    }
    setLoading(false)
  }

  async function handleSave(id: string, name: string, description: string) {
    const { error } = await supabase
      .from('collections')
      .update({ name, description: description || null })
      .eq('id', id)

    if (!error) {
      setCollections(prev => prev.map(c =>
        c.id === id ? { ...c, name, description: description || null } : c
      ))
    }
  }

  async function handleDelete(id: string) {
    // Zuerst alle Items der Sammlung löschen
    await supabase.from('items').delete().eq('collection_id', id)
    // Dann alle Kategorien
    await supabase.from('categories').delete().eq('collection_id', id)
    // Dann die Sammlung selbst
    const { error } = await supabase.from('collections').delete().eq('id', id)

    if (!error) {
      setCollections(prev => prev.filter(c => c.id !== id))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl font-bold text-gray-900">📦 CollectR</Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-600">Sammlungen</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Meine Sammlungen</h1>
          <Link
            href="/collections/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            ➕ Neue Sammlung
          </Link>
        </div>

        {collections.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-5xl mb-4">📭</div>
            <h2 className="text-xl font-semibold mb-2">Noch keine Sammlungen</h2>
            <p className="text-gray-600 mb-4">Erstelle deine erste Sammlung, um loszulegen!</p>
            <Link
              href="/collections/new"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Sammlung erstellen
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection) => (
              <div
                key={collection.id}
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition relative group"
              >
                {/* Edit/Delete Buttons */}
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      setEditCollection(collection)
                    }}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition"
                    title="Bearbeiten"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      setDeleteCollection(collection)
                    }}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-red-600 transition"
                    title="Löschen"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                <Link href={`/collections/${collection.id}`}>
                  <div className="text-3xl mb-2">📁</div>
                  <h3 className="text-lg font-semibold">{collection.name}</h3>
                  {collection.description && (
                    <p className="text-gray-600 text-sm mt-1 line-clamp-2">{collection.description}</p>
                  )}
                  <p className="text-gray-400 text-xs mt-2">
                    {collection.item_count} {collection.item_count === 1 ? 'Item' : 'Items'}
                  </p>
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      {editCollection && (
        <EditModal
          collection={editCollection}
          onClose={() => setEditCollection(null)}
          onSave={handleSave}
        />
      )}
      {deleteCollection && (
        <DeleteModal
          collection={deleteCollection}
          onClose={() => setDeleteCollection(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
