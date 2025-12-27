'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useToast } from '@/components/Toast'
import { useRealtimeRefresh } from '@/hooks'
import { ShareModal } from '@/components/ShareModal'

interface Collection {
  id: string
  name: string
  description: string | null
  item_count?: number
  is_shared?: boolean // true wenn geteilte Sammlung
  role?: 'viewer' | 'editor' | 'admin' // Rolle bei geteilten Sammlungen
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
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4 dark:text-white">Sammlung bearbeiten</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 dark:text-white"
              placeholder="z.B. Hot Wheels Sammlung"
              required
              autoFocus
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Beschreibung</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white dark:bg-slate-700 dark:text-white"
              rows={3}
              placeholder="Optional: Beschreibe deine Sammlung..."
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
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
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-2 text-red-600 dark:text-red-400">Sammlung löschen</h2>
        <p className="text-gray-600 dark:text-slate-300 mb-4">
          Möchtest du <strong>"{collection.name}"</strong> wirklich löschen?
        </p>

        {needsConfirm ? (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
            <p className="text-red-800 dark:text-red-300 text-sm mb-3">
              Diese Sammlung enthält <strong>{collection.item_count} Item(s)</strong>.
              Alle Items werden unwiderruflich gelöscht!
            </p>
            <label className="block text-sm font-medium text-red-800 dark:text-red-300 mb-1">
              Tippe "{collection.name}" zur Bestätigung:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              className="w-full px-3 py-2 border border-red-300 dark:border-red-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-slate-700 dark:text-white"
              placeholder={collection.name}
            />
          </div>
        ) : (
          <p className="text-gray-500 dark:text-slate-400 text-sm mb-4">
            Diese Sammlung ist leer und kann sicher gelöscht werden.
          </p>
        )}

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
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
  const { showToast } = useToast()
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [editCollection, setEditCollection] = useState<Collection | null>(null)
  const [deleteCollection, setDeleteCollection] = useState<Collection | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'items' | 'newest'>('newest')
  const [shareCollection, setShareCollection] = useState<Collection | null>(null)

  const loadCollections = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    // Eigene Collections laden
    const { data: ownCollections } = await supabase
      .from('collections')
      .select(`
        id,
        name,
        description,
        items(count)
      `)
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })

    // Geteilte Collections laden (wo User Mitglied ist)
    const { data: memberships } = await supabase
      .from('collection_members')
      .select(`
        role,
        collections (
          id,
          name,
          description,
          items(count)
        )
      `)
      .eq('user_id', user.id)

    const ownWithCount = (ownCollections || []).map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      item_count: (c.items as any)?.[0]?.count || 0,
      is_shared: false
    }))

    const sharedWithCount = (memberships || [])
      .filter(m => m.collections) // Filter null collections
      .map(m => ({
        id: (m.collections as any).id,
        name: (m.collections as any).name,
        description: (m.collections as any).description,
        item_count: ((m.collections as any).items as any)?.[0]?.count || 0,
        is_shared: true,
        role: m.role as 'viewer' | 'editor' | 'admin'
      }))

    setCollections([...ownWithCount, ...sharedWithCount])
    setLoading(false)
  }, [supabase, router])

  useEffect(() => {
    loadCollections()
  }, [loadCollections])

  // Realtime: Live-Updates wenn Collections/Items geändert werden
  useRealtimeRefresh('collections', loadCollections)
  useRealtimeRefresh('items', loadCollections)

  async function handleSave(id: string, name: string, description: string) {
    const { error } = await supabase
      .from('collections')
      .update({ name, description: description || null })
      .eq('id', id)

    if (!error) {
      setCollections(prev => prev.map(c =>
        c.id === id ? { ...c, name, description: description || null } : c
      ))
      showToast('Sammlung gespeichert!')
    } else {
      showToast('Fehler beim Speichern', 'error')
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
      showToast('Sammlung gelöscht!')
    } else {
      showToast('Fehler beim Löschen', 'error')
    }
  }

  // Filter und Sortieren
  const filteredCollections = collections
    .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'items':
          return (b.item_count || 0) - (a.item_count || 0)
        case 'newest':
        default:
          return 0 // already sorted by created_at desc
      }
    })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <header className="bg-white dark:bg-slate-800 shadow-sm border-b dark:border-slate-700">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="h-8 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              <span className="text-gray-400 dark:text-slate-500">/</span>
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-10 w-40 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-6 w-2/3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
                  <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl font-bold text-gray-900 dark:text-white">📦 CollectR</Link>
            <span className="text-gray-400 dark:text-slate-500">/</span>
            <span className="text-gray-600 dark:text-slate-400">Sammlungen</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold dark:text-white">Meine Sammlungen</h1>
          <Link
            href="/collections/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            + Neue Sammlung
          </Link>
        </div>

        {/* Search & Sort Bar */}
        {collections.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Sammlungen suchen..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 dark:text-white"
              />
            </div>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as 'name' | 'items' | 'newest')}
              className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 dark:text-white"
            >
              <option value="newest">Neueste zuerst</option>
              <option value="name">Name (A-Z)</option>
              <option value="items">Meiste Items</option>
            </select>
          </div>
        )}

        {filteredCollections.length === 0 && collections.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-12 text-center">
            <div className="text-5xl mb-4">📭</div>
            <h2 className="text-xl font-semibold mb-2 dark:text-white">Noch keine Sammlungen</h2>
            <p className="text-gray-600 dark:text-slate-400 mb-4">Erstelle deine erste Sammlung, um loszulegen!</p>
            <Link
              href="/collections/new"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Sammlung erstellen
            </Link>
          </div>
        ) : filteredCollections.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-12 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-xl font-semibold mb-2 dark:text-white">Keine Ergebnisse</h2>
            <p className="text-gray-600 dark:text-slate-400 mb-4">Keine Sammlungen gefunden für "{searchQuery}"</p>
            <button
              onClick={() => setSearchQuery('')}
              className="text-blue-600 hover:underline"
            >
              Suche zurücksetzen
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCollections.map((collection) => (
              <div
                key={collection.id}
                className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border p-6 hover:shadow-md transition relative group ${
                  collection.is_shared
                    ? 'border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600'
                    : 'border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600'
                }`}
              >
                {/* Action Buttons - nur für eigene Sammlungen */}
                {!collection.is_shared && (
                  <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        setShareCollection(collection)
                      }}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition"
                      title="Teilen"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        setEditCollection(collection)
                      }}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
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
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition"
                      title="Löschen"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}

                {/* Shared Badge */}
                {collection.is_shared && (
                  <div className="absolute top-3 right-3">
                    <span className="px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-full">
                      {collection.role === 'viewer' ? 'Betrachter' : collection.role === 'editor' ? 'Bearbeiter' : 'Admin'}
                    </span>
                  </div>
                )}

                <Link href={`/collections/${collection.id}`}>
                  <div className="text-3xl mb-2">{collection.is_shared ? '👥' : '📁'}</div>
                  <h3 className="text-lg font-semibold dark:text-white">{collection.name}</h3>
                  {collection.description && (
                    <p className="text-gray-600 dark:text-slate-400 text-sm mt-1 line-clamp-2">{collection.description}</p>
                  )}
                  <p className="text-gray-400 dark:text-slate-500 text-xs mt-2">
                    {collection.item_count} {collection.item_count === 1 ? 'Item' : 'Items'}
                    {collection.is_shared && ' • Geteilt mit dir'}
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
      {shareCollection && (
        <ShareModal
          collectionId={shareCollection.id}
          collectionName={shareCollection.name}
          isOwner={true}
          onClose={() => setShareCollection(null)}
        />
      )}
    </div>
  )
}
