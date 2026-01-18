'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { use } from 'react'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ token: string }>
}

interface InvitationInfo {
  collection_name: string
  role: string
  invited_by_email: string
  expires_at: string
}

const ROLE_LABELS: Record<string, string> = {
  viewer: 'Betrachter',
  editor: 'Bearbeiter',
  admin: 'Administrator'
}

export default function InvitePage({ params }: PageProps) {
  const { token } = use(params)
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ collectionId: string } | null>(null)
  const [invitation, setInvitation] = useState<InvitationInfo | null>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    checkInvitation()
  }, [token])

  async function checkInvitation() {
    setLoading(true)

    // User prüfen
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)

    // Einladung laden (über RPC um Collection-Name zu bekommen)
    const { data, error } = await supabase
      .from('collection_invitations')
      .select(`
        id,
        role,
        expires_at,
        accepted_at,
        collections (
          name
        )
      `)
      .eq('invite_token', token)
      .single()

    if (error || !data) {
      setError('Einladung nicht gefunden')
      setLoading(false)
      return
    }

    if (data.accepted_at) {
      setError('Diese Einladung wurde bereits verwendet')
      setLoading(false)
      return
    }

    if (new Date(data.expires_at) < new Date()) {
      setError('Diese Einladung ist abgelaufen')
      setLoading(false)
      return
    }

    setInvitation({
      collection_name: (data.collections as any)?.name || 'Unbekannte Sammlung',
      role: data.role,
      invited_by_email: '', // Könnte über Edge Function geholt werden
      expires_at: data.expires_at
    })

    setLoading(false)
  }

  async function acceptInvitation() {
    if (!user) {
      // Zur Login-Seite mit Redirect zurück
      router.push(`/login?redirect=/invite/${token}`)
      return
    }

    setAccepting(true)

    // RPC Funktion aufrufen
    const { data, error } = await supabase.rpc('accept_collection_invitation', {
      p_token: token
    })

    if (error) {
      setError('Fehler beim Annehmen der Einladung: ' + error.message)
      setAccepting(false)
      return
    }

    if (data && !data.success) {
      setError(data.error || 'Unbekannter Fehler')
      setAccepting(false)
      return
    }

    if (data?.success) {
      setSuccess({ collectionId: data.collection_id })
    }

    setAccepting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg card-padding max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Einladung ungültig
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-4 sm:mb-6">
            {error}
          </p>
          <Link
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Zur Startseite
          </Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg card-padding max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Erfolgreich beigetreten!
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-4 sm:mb-6">
            Du hast jetzt Zugriff auf "{invitation?.collection_name}".
          </p>
          <Link
            href={`/collections/${success.collectionId}`}
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Zur Sammlung
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg card-padding max-w-md w-full">
        <div className="text-center mb-4 sm:mb-6">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Einladung zur Sammlung
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Du wurdest eingeladen, einer Sammlung beizutreten
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 mb-4 sm:mb-6">
          <div className="mb-3">
            <div className="text-sm text-slate-500 dark:text-slate-400">Sammlung</div>
            <div className="font-semibold text-slate-900 dark:text-white">
              {invitation?.collection_name}
            </div>
          </div>
          <div className="mb-3">
            <div className="text-sm text-slate-500 dark:text-slate-400">Deine Rolle</div>
            <div className="font-semibold text-slate-900 dark:text-white">
              {ROLE_LABELS[invitation?.role || 'viewer']}
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Gültig bis</div>
            <div className="font-semibold text-slate-900 dark:text-white">
              {invitation?.expires_at ? new Date(invitation.expires_at).toLocaleDateString('de-DE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }) : '-'}
            </div>
          </div>
        </div>

        {!user ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
              Du musst eingeloggt sein, um die Einladung anzunehmen.
            </p>
            <div className="flex gap-3">
              <Link
                href={`/login?redirect=/invite/${token}`}
                className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition text-center font-medium"
              >
                Einloggen
              </Link>
              <Link
                href={`/register?redirect=/invite/${token}`}
                className="flex-1 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 px-4 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition text-center font-medium"
              >
                Registrieren
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
              Eingeloggt als <strong>{user.email}</strong>
            </p>
            <button
              onClick={acceptInvitation}
              disabled={accepting}
              className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium"
            >
              {accepting ? 'Wird angenommen...' : 'Einladung annehmen'}
            </button>
            <Link
              href="/"
              className="block text-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
            >
              Abbrechen
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
