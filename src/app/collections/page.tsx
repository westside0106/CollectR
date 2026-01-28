'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useToast } from '@/components/Toast'
import { useRealtimeRefresh, usePullToRefresh } from '@/hooks'
import { ShareModal } from '@/components/ShareModal'
import { CollectionCardSkeleton } from '@/components/Skeleton'
import EmojiPicker from '@/components/EmojiPicker'
import { CollectionFolderCard } from '@/components/CollectionFolderCard'

interface Collection {
  id: string
  name: string
  description: string | null
  settings?: { icon?: string } | null
  item_count?: number
  is_shared?: boolean // true wenn geteilte Sammlung
  role?: 'viewer' | 'editor' | 'admin' // Rolle bei geteilten Sammlungen
}

interface EditModalProps {
  collection: Collection
  onClose: () => void
  onSave: (id: string, name: string, description: string, icon: string) => Promise<void>
}

function EditModal({ collection, onClose, onSave }: EditModalProps) {
  const [name, setName] = useState(collection.name)
  const [description, setDescription] = useState(collection.description || '')
  const [icon, setIcon] = useState(collection.settings?.icon || '📁')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    await onSave(collection.id, name.trim(), description.trim(), icon)
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md modal-responsive p-4 sm:p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg sm:text-xl font-bold mb-4 dark:text-white">Sammlung bearbeiten</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4 flex gap-4 items-start">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Icon</label>
              <EmojiPicker value={icon} onChange={setIcon} />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Name *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 bg-white dark:bg-slate-700 dark:text-white"
                placeholder="z.B. Hot Wheels Sammlung"
                required
                autoFocus
              />
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Beschreibung</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 resize-none bg-white dark:bg-slate-700 dark:text-white"
              rows={3}
              placeholder="Optional: Beschreibe deine Sammlung..."
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="button-responsive rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="button-responsive rounded-lg bg-accent-500 text-white hover:bg-accent-600 transition disabled:opacity-50"
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
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md modal-responsive p-4 sm:p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg sm:text-xl font-bold mb-2 text-red-600 dark:text-red-400">Sammlung löschen</h2>
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

        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="button-responsive rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
          >
            Abbrechen
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting || (needsConfirm && confirmText !== collection.name)}
            className="button-responsive rounded-lg bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50"
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
        settings,
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
          settings,
          items(count)
        )
      `)
      .eq('user_id', user.id)

    const ownWithCount = (ownCollections || []).map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      settings: c.settings as { icon?: string } | null,
      item_count: (c.items as any)?.[0]?.count || 0,
      is_shared: false
    }))

    const sharedWithCount = (memberships || [])
      .filter(m => m.collections) // Filter null collections
      .map(m => ({
        id: (m.collections as any).id,
        name: (m.collections as any).name,
        description: (m.collections as any).description,
        settings: (m.collections as any).settings as { icon?: string } | null,
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

  // Pull-to-Refresh
  const { isRefreshing: isPullRefreshing, isPulling, pullDistance, shouldRefresh } = usePullToRefresh({
    onRefresh: loadCollections,
    threshold: 80
  })

  async function handleSave(id: string, name: string, description: string, icon: string) {
    // Bestehende settings laden und icon mergen
    const collection = collections.find(c => c.id === id)
    const existingSettings = collection?.settings || {}
    const newSettings = { ...existingSettings, icon }

    const { error } = await supabase
      .from('collections')
      .update({ name, description: description || null, settings: newSettings })
      .eq('id', id)

    if (!error) {
      setCollections(prev => prev.map(c =>
        c.id === id ? { ...c, name, description: description || null, settings: newSettings } : c
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
          <div className="max-w-7xl mx-auto container-responsive py-3 sm:py-4 flex justify-between items-center">
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/" className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">📦 CollectR</Link>
              <span className="text-gray-400 dark:text-slate-500 hidden sm:inline">/</span>
              <span className="text-gray-600 dark:text-slate-400 text-sm sm:text-base hidden sm:inline">Sammlungen</span>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto container-responsive py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h1 className="heading-responsive font-bold dark:text-white">Meine Sammlungen</h1>
            <Link
              href="/collections/new"
              className="button-responsive bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition w-full sm:w-auto text-center"
            >
              + Neue Sammlung
            </Link>
          </div>
          <div className="grid grid-responsive-3 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <CollectionCardSkeleton key={i} />
            ))}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900" data-pull-refresh>
      {/* Pull-to-Refresh Indicator */}
      {(isPulling || isPullRefreshing) && (
        <div
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center transition-all duration-300 pointer-events-none"
          style={{
            transform: `translateY(${isPullRefreshing ? '60px' : Math.min(pullDistance, 80)}px)`,
            opacity: isPullRefreshing ? 1 : pullDistance / 80
          }}
        >
          <div className={`bg-white dark:bg-slate-800 rounded-full p-3 shadow-lg border-2 ${
            shouldRefresh || isPullRefreshing
              ? 'border-blue-500 dark:border-blue-400'
              : 'border-slate-300 dark:border-slate-600'
          }`}>
            <svg
              className={`w-6 h-6 ${
                isPullRefreshing ? 'animate-spin text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
        </div>
      )}

      <header className="bg-white dark:bg-slate-800 shadow-sm border-b dark:border-slate-700">
        <div className="max-w-7xl mx-auto container-responsive py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/" className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">📦 CollectR</Link>
            <span className="text-gray-400 dark:text-slate-500 hidden sm:inline">/</span>
            <span className="text-gray-600 dark:text-slate-400 text-sm sm:text-base hidden sm:inline">Sammlungen</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto container-responsive py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="heading-responsive font-bold dark:text-white">Meine Sammlungen</h1>
          <Link
            href="/collections/new"
            className="button-responsive bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition w-full sm:w-auto text-center"
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 dark:text-white text-sm sm:text-base"
              />
            </div>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as 'name' | 'items' | 'newest')}
              className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 dark:text-white text-sm sm:text-base"
            >
              <option value="newest">Neueste zuerst</option>
              <option value="name">Name (A-Z)</option>
              <option value="items">Meiste Items</option>
            </select>
          </div>
        )}

        {filteredCollections.length === 0 && collections.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm card-padding text-center">
            <div className="text-4xl sm:text-5xl mb-4">📭</div>
            <h2 className="subheading-responsive font-semibold mb-2 dark:text-white">Noch keine Sammlungen</h2>
            <p className="text-responsive text-gray-600 dark:text-slate-400 mb-4">Erstelle deine erste Sammlung, um loszulegen!</p>
            <Link
              href="/collections/new"
              className="inline-block bg-accent-500 text-white button-responsive rounded-lg hover:bg-accent-600 transition"
            >
              Sammlung erstellen
            </Link>
          </div>
        ) : filteredCollections.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm card-padding text-center">
            <div className="text-4xl sm:text-5xl mb-4">🔍</div>
            <h2 className="subheading-responsive font-semibold mb-2 dark:text-white">Keine Ergebnisse</h2>
            <p className="text-responsive text-gray-600 dark:text-slate-400 mb-4">Keine Sammlungen gefunden für "{searchQuery}"</p>
            <button
              onClick={() => setSearchQuery('')}
              className="text-blue-600 hover:underline text-sm sm:text-base"
            >
              Suche zurücksetzen
            </button>
          </div>
        ) : (
          <div className="grid grid-responsive-3 gap-4 sm:gap-6">
            {filteredCollections.map((collection) => (
              <CollectionFolderCard
                key={collection.id}
                collection={collection}
                onEdit={!collection.is_shared ? () => setEditCollection(collection) : undefined}
                onDelete={!collection.is_shared ? () => setDeleteCollection(collection) : undefined}
                onShare={!collection.is_shared ? () => setShareCollection(collection) : undefined}
              />
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
