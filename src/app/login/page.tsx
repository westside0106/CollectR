'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        window.location.href = '/'
      }
    } catch (err) {
      setError('Ein unerwarteter Fehler ist aufgetreten')
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-950 p-4 overflow-hidden">
      {/* Gold ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#d4a038]/8 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Image
            src="/brand/collectr-hero.png"
            alt="CollectR Logo"
            width={72}
            height={72}
            className="mx-auto mb-4 rounded-2xl shadow-[0_0_30px_rgba(212,160,56,0.25)]"
          />
          <h1 className="text-2xl sm:text-3xl font-bold text-white">CollectR</h1>
          <p className="text-sm sm:text-base text-white/45 mt-2">Melde dich an</p>
        </div>

        <form
          onSubmit={handleLogin}
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
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#d4a038] hover:bg-[#e8b84a] text-slate-950 py-3 rounded-xl font-semibold transition-all duration-200 shadow-[0_0_20px_rgba(212,160,56,0.4)] hover:shadow-[0_0_35px_rgba(212,160,56,0.6)] disabled:opacity-50"
          >
            {loading ? 'Wird angemeldet...' : 'Anmelden'}
          </button>

          <p className="text-center text-sm text-white/40">
            Noch kein Konto?{' '}
            <Link href="/register" className="text-[#d4a038] hover:text-[#e8b84a] transition-colors">
              Registrieren
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
