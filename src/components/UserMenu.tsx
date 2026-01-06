'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export function UserMenu() {
  const router = useRouter()
  const supabase = createClient()
  
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(profileData)
      }
      
      setLoading(false)
    }
    loadUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (loading) {
    return <div className="w-8 h-8 bg-slate-200 rounded-full animate-pulse" />
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
      >
        Anmelden
      </Link>
    )
  }

  const displayName = profile?.display_name || user.email?.split('@')[0] || 'User'
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 hover:bg-slate-700 rounded-lg p-2 transition-colors"
      >
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
          {initials}
        </div>
        <span className="text-sm text-white hidden sm:block">{displayName}</span>
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 bottom-full mb-2 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-600 z-20 overflow-hidden max-h-[80vh] overflow-y-auto">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
              <p className="font-medium text-sm text-slate-900 dark:text-white truncate">{displayName}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{user.email}</p>
            </div>
            <div className="py-1">
              <Link
                href="/profile"
                className="flex items-center gap-2 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm text-slate-700 dark:text-slate-200 transition-colors"
                onClick={() => setShowMenu(false)}
              >
                <span>👤</span>
                <span>Profil</span>
              </Link>
              <Link
                href="/collections"
                className="flex items-center gap-2 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm text-slate-700 dark:text-slate-200 transition-colors"
                onClick={() => setShowMenu(false)}
              >
                <span>📁</span>
                <span>Meine Sammlungen</span>
              </Link>
              <Link
                href="/settings"
                className="flex items-center gap-2 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm text-slate-700 dark:text-slate-200 transition-colors"
                onClick={() => setShowMenu(false)}
              >
                <span>⚙️</span>
                <span>Einstellungen</span>
              </Link>
            </div>
            <hr className="border-slate-200 dark:border-slate-700" />
            <div className="py-1">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full text-left px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm text-red-600 dark:text-red-400 transition-colors"
              >
                <span>🚪</span>
                <span>Abmelden</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
