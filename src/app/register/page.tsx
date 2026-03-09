'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'

function WaxLogoFilter() {
  return (
    <svg style={{ display: 'none' }} aria-hidden>
      <defs>
        <filter id="wax-remove-white" colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  -0.9 -0.9 -0.9 0 2.7"
          />
        </filter>
      </defs>
    </svg>
  )
}

export default function RegisterPage() {
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
        if (error.message.includes('email')) {
          setError('Fehler beim Senden der Bestätigungs-E-Mail. Bitte überprüfe deine E-Mail-Adresse oder versuche es später erneut.')
        } else if (error.message.includes('password')) {
          setError('Das Passwort erfüllt nicht die Sicherheitsanforderungen. Bitte verwende mindestens 6 Zeichen.')
        } else {
          setError(`Registrierung fehlgeschlagen: ${error.message}`)
        }
        setLoading(false)
      } else if (data.user && !data.user.identities?.length) {
        setError('Ein Konto mit dieser E-Mail existiert bereits')
        setLoading(false)
      } else {
        setSuccess(true)
      }
    } catch (err) {
      console.error('Registration error:', err)
      setError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es später erneut.')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-slate-950 p-4 overflow-hidden">
        <WaxLogoFilter />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#d4a038]/8 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative w-full max-w-md text-center">
          <div className="bg-slate-900/70 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
            <div className="text-4xl sm:text-5xl mb-4">✉️</div>
            <h2 className="text-lg sm:text-xl font-bold mb-2 text-white">Bestätige deine E-Mail</h2>
            <p className="text-sm sm:text-base text-white/45 mb-6">
              Wir haben dir eine E-Mail an <strong className="text-white/70">{email}</strong> geschickt.
              Klicke auf den Link in der E-Mail, um dein Konto zu aktivieren.
            </p>
            <Link href="/login" className="text-sm text-[#d4a038] hover:text-[#e8b84a] transition-colors">
              Zurück zum Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-950 p-4 overflow-hidden">
      <WaxLogoFilter />
      {/* Gold ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#d4a038]/8 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Image
            src="/brand/collectr-r.png"
            alt="CollectR Logo"
            width={88}
            height={88}
            className="mx-auto mb-4"
            style={{
              filter: 'url(#wax-remove-white) drop-shadow(0 0 22px rgba(212,160,56,0.75))',
            }}
          />
          <h1 className="text-2xl sm:text-3xl font-bold text-white">CollectR</h1>
          <p className="text-sm sm:text-base text-white/45 mt-2">Erstelle ein Konto</p>
        </div>

        <form
          onSubmit={handleRegister}
          className="bg-slate-900/70 backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] space-y-4"
        >
          {error && (
            <div className="bg-red-900/20 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-white/60 mb-1.5">
              E-Mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-white/10 rounded-xl bg-slate-800/60 text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-[#d4a038]/60 focus:border-[#d4a038]/60 transition-all"
              placeholder="deine@email.de"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-1.5">
              Passwort
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-white/10 rounded-xl bg-slate-800/60 text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-[#d4a038]/60 focus:border-[#d4a038]/60 transition-all"
              placeholder="Mindestens 6 Zeichen"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-1.5">
              Passwort bestätigen
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-white/10 rounded-xl bg-slate-800/60 text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-[#d4a038]/60 focus:border-[#d4a038]/60 transition-all"
              placeholder="Passwort wiederholen"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#d4a038] hover:bg-[#e8b84a] text-slate-950 py-3 rounded-xl font-semibold transition-all duration-200 shadow-[0_0_20px_rgba(212,160,56,0.4)] hover:shadow-[0_0_35px_rgba(212,160,56,0.6)] disabled:opacity-50"
          >
            {loading ? 'Wird registriert...' : 'Registrieren'}
          </button>

          <p className="text-center text-sm text-white/40">
            Bereits ein Konto?{' '}
            <Link href="/login" className="text-[#d4a038] hover:text-[#e8b84a] transition-colors">
              Anmelden
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
