'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useToast } from '@/components/Toast'

interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
}

interface SharedCollection {
  id: string
  role: 'viewer' | 'editor' | 'admin'
  collection: {
    id: string
    name: string
    owner_id: string
  }
}

interface Stats {
  collections: number
  items: number
  sharedWithMe: number
  sharedByMe: number
}

const ROLE_LABELS: Record<string, string> = {
  viewer: 'Betrachter',
  editor: 'Bearbeiter',
  admin: 'Admin'
}

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()

  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state
  const [displayName, setDisplayName] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Stats & shared collections
  const [stats, setStats] = useState<Stats>({ collections: 0, items: 0, sharedWithMe: 0, sharedByMe: 0 })
  const [sharedCollections, setSharedCollections] = useState<SharedCollection[]>([])

  // Theme
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')

  useEffect(() => {
    loadData()
    // Load theme preference
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null
    if (savedTheme) setTheme(savedTheme)
  }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    setUser(user)

    // Load profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileData) {
      setProfile(profileData)
      setDisplayName(profileData.display_name || '')
    }

    // Load stats
    const [collectionsRes, itemsRes, sharedWithMeRes, sharedByMeRes] = await Promise.all([
      supabase.from('collections').select('id', { count: 'exact' }).eq('owner_id', user.id),
      supabase.from('items').select('id', { count: 'exact' }).eq('owner_id', user.id),
      supabase.from('collection_members').select('id', { count: 'exact' }).eq('user_id', user.id),
      supabase.from('collection_invitations').select('id', { count: 'exact' }).eq('invited_by', user.id).is('accepted_at', null)
    ])

    setStats({
      collections: collectionsRes.count || 0,
      items: itemsRes.count || 0,
      sharedWithMe: sharedWithMeRes.count || 0,
      sharedByMe: sharedByMeRes.count || 0
    })

    // Load shared collections
    const { data: memberships } = await supabase
      .from('collection_members')
      .select(`
        id,
        role,
        collections (
          id,
          name,
          owner_id
        )
      `)
      .eq('user_id', user.id)

    if (memberships) {
      setSharedCollections(memberships.map(m => ({
        id: m.id,
        role: m.role,
        collection: m.collections as any
      })).filter(m => m.collection))
    }

    setLoading(false)
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    setSaving(true)

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        display_name: displayName.trim() || null,
        updated_at: new Date().toISOString()
      })

    if (error) {
      showToast('Fehler beim Speichern', 'error')
    } else {
      showToast('Profil gespeichert!')
      setProfile(prev => prev ? { ...prev, display_name: displayName.trim() || null } : null)
    }

    setSaving(false)
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      showToast('Passwörter stimmen nicht überein', 'error')
      return
    }

    if (newPassword.length < 6) {
      showToast('Passwort muss mindestens 6 Zeichen haben', 'error')
      return
    }

    setSaving(true)

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      showToast('Fehler: ' + error.message, 'error')
    } else {
      showToast('Passwort geändert!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }

    setSaving(false)
  }

  async function handleLeaveCollection(membershipId: string, collectionName: string) {
    if (!confirm(`Möchtest du "${collectionName}" wirklich verlassen?`)) return

    const { error } = await supabase
      .from('collection_members')
      .delete()
      .eq('id', membershipId)

    if (!error) {
      setSharedCollections(prev => prev.filter(c => c.id !== membershipId))
      setStats(prev => ({ ...prev, sharedWithMe: prev.sharedWithMe - 1 }))
      showToast('Sammlung verlassen')
    } else {
      showToast('Fehler beim Verlassen', 'error')
    }
  }

  function handleThemeChange(newTheme: 'light' | 'dark' | 'system') {
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)

    // Apply theme
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark')
    } else {
      // System preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }

    showToast('Design geändert')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 space-y-4">
            <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-10 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-10 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 sm:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-sm flex items-center gap-1 mb-2"
          >
            ← Zurück zum Dashboard
          </Link>
          <h1 className="text-2xl font-bold dark:text-white">Einstellungen</h1>
          <p className="text-slate-700 dark:text-slate-300 mt-1">{user?.email}</p>
        </div>

        <div className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Link
              href="/settings/costs"
              className="bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl p-4 text-white hover:shadow-lg transition-shadow group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">💰</span>
                <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <div className="text-lg font-semibold">Service Kosten</div>
              <div className="text-xs opacity-90 mt-1">Monitoring & Budget</div>
            </Link>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <div className="text-2xl font-bold dark:text-white">{stats.collections}</div>
              <div className="text-sm text-slate-700 dark:text-slate-300">Sammlungen</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <div className="text-2xl font-bold dark:text-white">{stats.items}</div>
              <div className="text-sm text-slate-700 dark:text-slate-300">Items</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.sharedWithMe}</div>
              <div className="text-sm text-slate-700 dark:text-slate-300">Geteilt mit mir</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.sharedByMe}</div>
              <div className="text-sm text-slate-700 dark:text-slate-300">Offene Einladungen</div>
            </div>
          </div>

          {/* Profile Settings */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold dark:text-white">Profil</h2>
            </div>
            <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Anzeigename
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder={user?.email?.split('@')[0]}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">
                  Wird anderen Nutzern angezeigt
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  E-Mail
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {saving ? 'Speichern...' : 'Speichern'}
                </button>
              </div>
            </form>
          </div>

          {/* Theme Settings */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold dark:text-white">Erscheinungsbild</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => handleThemeChange('light')}
                  className={`p-4 rounded-lg border-2 transition ${
                    theme === 'light'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="text-2xl mb-2">☀️</div>
                  <div className="text-sm font-medium dark:text-white">Hell</div>
                </button>
                <button
                  onClick={() => handleThemeChange('dark')}
                  className={`p-4 rounded-lg border-2 transition ${
                    theme === 'dark'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="text-2xl mb-2">🌙</div>
                  <div className="text-sm font-medium dark:text-white">Dunkel</div>
                </button>
                <button
                  onClick={() => handleThemeChange('system')}
                  className={`p-4 rounded-lg border-2 transition ${
                    theme === 'system'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="text-2xl mb-2">💻</div>
                  <div className="text-sm font-medium dark:text-white">System</div>
                </button>
              </div>
            </div>
          </div>

          {/* Shared Collections */}
          {sharedCollections.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold dark:text-white">Geteilte Sammlungen</h2>
                <p className="text-sm text-slate-700 dark:text-slate-300">Sammlungen, die mit dir geteilt wurden</p>
              </div>
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {sharedCollections.map(sc => (
                  <div key={sc.id} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400">
                        👥
                      </div>
                      <div>
                        <Link
                          href={`/collections/${sc.collection.id}`}
                          className="font-medium dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          {sc.collection.name}
                        </Link>
                        <div className="text-sm text-slate-700 dark:text-slate-300">
                          {ROLE_LABELS[sc.role]}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleLeaveCollection(sc.id, sc.collection.name)}
                      className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Verlassen
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Password Change */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold dark:text-white">Passwort ändern</h2>
            </div>
            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Neues Passwort
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Passwort bestätigen
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  minLength={6}
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving || !newPassword || !confirmPassword}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {saving ? 'Ändern...' : 'Passwort ändern'}
                </button>
              </div>
            </form>
          </div>

          {/* Account Info */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold dark:text-white">Account</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium dark:text-white">Account erstellt</div>
                  <div className="text-sm text-slate-700 dark:text-slate-300">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString('de-DE', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    }) : '-'}
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium dark:text-white">Letzte Anmeldung</div>
                  <div className="text-sm text-slate-700 dark:text-slate-300">
                    {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('de-DE', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : '-'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-red-200 dark:border-red-900 overflow-hidden">
            <div className="px-6 py-4 border-b border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20">
              <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">Gefahrenzone</h2>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Wenn du deinen Account löschst, werden alle deine Sammlungen und Items unwiderruflich gelöscht.
              </p>
              <button
                onClick={() => showToast('Account-Löschung ist noch nicht implementiert', 'error')}
                className="px-4 py-2 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition"
              >
                Account löschen
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
