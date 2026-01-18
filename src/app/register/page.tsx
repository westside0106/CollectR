'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      })

      if (error) {
        setError(error.message)
        setLoading(false)
      } else if (data.user && !data.user.identities?.length) {
        setError('Ein Konto mit dieser E-Mail existiert bereits')
        setLoading(false)
      } else {
        setSuccess(true)
      }
    } catch (err) {
      setError('Ein unerwarteter Fehler ist aufgetreten')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white dark:bg-slate-800 card-padding sm:card-padding rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">✉️</div>
            <h2 className="text-lg sm:text-xl font-bold mb-2 text-slate-900 dark:text-white">Bestätige deine E-Mail</h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-4">
              Wir haben dir eine E-Mail an <strong>{email}</strong> geschickt.
              Klicke auf den Link in der E-Mail, um dein Konto zu aktivieren.
            </p>
            <Link href="/login" className="text-sm sm:text-base text-blue-600 dark:text-blue-400 hover:underline">
              Zurück zum Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-4 sm:mb-6 sm:mb-4 sm:mb-6 sm:mb-8">
          <Image
            src="/icons/icon-512.png"
            alt="CollectR Logo"
            width={96}
            height={96}
            className="mx-auto mb-3 sm:mb-4 rounded-[22%] shadow-lg"
          />
          <h1 className="text-2xl sm:text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">CollectR</h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-2">Erstelle ein Konto</p>
        </div>

        <form onSubmit={handleRegister} className="bg-white dark:bg-slate-800 card-padding sm:card-padding rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              E-Mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="deine@email.de"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Passwort
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Mindestens 6 Zeichen"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Passwort bestätigen
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Passwort wiederholen"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
          >
            {loading ? 'Wird registriert...' : 'Registrieren'}
          </button>

          <p className="text-center text-sm text-slate-600 dark:text-slate-400">
            Bereits ein Konto?{' '}
            <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline">
              Anmelden
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
