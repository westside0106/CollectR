'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

/* SVG filter to remove white background from the wax seal PNG */
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

export default function LoginPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [splashDone, setSplashDone] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setSplashDone(true), 1400)
    return () => clearTimeout(t)
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        window.location.href = '/'
      }
    } catch {
      setError('Ein unerwarteter Fehler ist aufgetreten')
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-950 p-4 overflow-hidden">
      <WaxLogoFilter />

      {/* Gold ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-[#d4a038]/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Splash: logo centered, fades out */}
      <AnimatePresence>
        {!splashDone && (
          <motion.div
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <Image
                src="/brand/collectr-r.png"
                alt="CollectR"
                width={120}
                height={120}
                priority
                style={{
                  filter: 'url(#wax-remove-white) drop-shadow(0 0 30px rgba(212,160,56,0.9))',
                }}
              />
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="mt-4 text-white/50 text-sm font-medium tracking-widest uppercase"
            >
              Collectorssphere
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form — slides up after splash */}
      <AnimatePresence>
        {splashDone && (
          <motion.div
            className="relative w-full max-w-md"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="text-center mb-8">
              <Image
                src="/brand/collectr-r.png"
                alt="CollectR Logo"
                width={88}
                height={88}
                priority
                className="mx-auto mb-4"
                style={{
                  filter: 'url(#wax-remove-white) drop-shadow(0 0 22px rgba(212,160,56,0.75))',
                }}
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
                <label className="block text-sm font-medium text-white/60 mb-1.5">E-Mail</label>
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
                <label className="block text-sm font-medium text-white/60 mb-1.5">Passwort</label>
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
