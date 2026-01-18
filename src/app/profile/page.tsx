'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
}

interface Stats {
  collections: number
  items: number
  sharedWithMe: number
  totalValue: number
}

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<Stats>({ collections: 0, items: 0, sharedWithMe: 0, totalValue: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
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
    }

    // Load stats
    const [collectionsRes, itemsRes, sharedWithMeRes] = await Promise.all([
      supabase.from('collections').select('id', { count: 'exact' }).eq('owner_id', user.id),
      supabase.from('items').select('id', { count: 'exact' }).eq('owner_id', user.id),
      supabase.from('collection_members').select('id', { count: 'exact' }).eq('user_id', user.id)
    ])

    setStats({
      collections: collectionsRes.count || 0,
      items: itemsRes.count || 0,
      sharedWithMe: sharedWithMeRes.count || 0,
      totalValue: 0 // Can be calculated later
    })

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 sm:p-8">
        <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
          <div className="h-6 sm:h-8 w-32 sm:w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 space-y-3 sm:space-y-4">
            <div className="h-5 sm:h-6 w-24 sm:w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-8 sm:h-10 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'User'
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 sm:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link
            href="/"
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-xs sm:text-sm flex items-center gap-1 mb-2"
          >
            ← Zurück zum Dashboard
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold dark:text-white">Mein Profil</h1>
        </div>

        <div className="space-y-6">
          {/* Profile Card */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-4 sm:p-6 md:p-8">
              <div className="flex items-center gap-4 sm:gap-6 mb-4 sm:mb-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl font-bold">
                  {initials}
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold dark:text-white mb-1">{displayName}</h2>
                  <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300">{user?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-slate-200 dark:border-slate-700">
                <div>
                  <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mb-1">Mitglied seit</div>
                  <div className="text-sm sm:text-base font-medium dark:text-white">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString('de-DE', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    }) : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mb-1">Letzte Anmeldung</div>
                  <div className="text-sm sm:text-base font-medium dark:text-white">
                    {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('de-DE', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    }) : '-'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <Link
              href="/collections"
              className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 sm:p-6 text-white hover:shadow-lg transition-all hover:scale-105"
            >
              <div className="text-3xl sm:text-4xl font-bold mb-1 sm:mb-2">{stats.collections}</div>
              <div className="text-sm sm:text-base text-blue-100">Sammlungen</div>
            </Link>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700">
              <div className="text-3xl sm:text-4xl font-bold text-purple-600 dark:text-purple-400 mb-1 sm:mb-2">{stats.items}</div>
              <div className="text-sm sm:text-base text-slate-700 dark:text-slate-300">Items</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700">
              <div className="text-3xl sm:text-4xl font-bold text-green-600 dark:text-green-400 mb-1 sm:mb-2">{stats.sharedWithMe}</div>
              <div className="text-sm sm:text-base text-slate-700 dark:text-slate-300">Geteilt</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-base sm:text-lg font-semibold dark:text-white">Schnellzugriff</h2>
            </div>
            <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <Link
                href="/collections"
                className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <span className="text-xl sm:text-2xl">📁</span>
                <div>
                  <div className="text-sm sm:text-base font-medium dark:text-white">Meine Sammlungen</div>
                  <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Alle Sammlungen ansehen</div>
                </div>
              </Link>
              <Link
                href="/settings"
                className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <span className="text-xl sm:text-2xl">⚙️</span>
                <div>
                  <div className="text-sm sm:text-base font-medium dark:text-white">Einstellungen</div>
                  <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Profil bearbeiten</div>
                </div>
              </Link>
              <Link
                href="/tcg"
                className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <span className="text-xl sm:text-2xl">🎴</span>
                <div>
                  <div className="text-sm sm:text-base font-medium dark:text-white">TCG Hub</div>
                  <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Trading Card Games</div>
                </div>
              </Link>
              <Link
                href="/hub"
                className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <span className="text-xl sm:text-2xl">🌐</span>
                <div>
                  <div className="text-sm sm:text-base font-medium dark:text-white">Alle Hubs</div>
                  <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Entdecke alle Kategorien</div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
