'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useAnimation, AnimatePresence } from 'framer-motion'

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

  // Seal animation state
  const rotateControls = useAnimation()
  const scaleControls = useAnimation()
  const [totalRotation, setTotalRotation] = useState(0)
  const [glowing, setGlowing] = useState(false)
  const [formVisible, setFormVisible] = useState(false)

  // Intro sequence
  useEffect(() => {
    async function runIntro() {
      // 1. Seal spins in from -30deg while fading
      await rotateControls.start({
        rotate: 0,
        transition: { duration: 1.1, ease: [0.22, 1, 0.36, 1] },
      })
      // 2. Brief pulse
      await scaleControls.start({
        scale: [1, 1.08, 1],
        transition: { duration: 0.45, ease: 'easeInOut' },
      })
      // 3. Show form
      setFormVisible(true)
    }
    runIntro()
  }, [rotateControls, scaleControls])

  // Magic spin on click
  async function handleSealClick() {
    if (glowing) return
    const newRot = totalRotation + 360
    setTotalRotation(newRot)
    setGlowing(true)

    rotateControls.start({
      rotate: newRot,
      transition: { type: 'spring', stiffness: 55, damping: 9 },
    })
    scaleControls.start({
      scale: [1, 1.15, 0.95, 1.05, 1],
      transition: { duration: 0.7, times: [0, 0.25, 0.55, 0.8, 1] },
    })

    setTimeout(() => setGlowing(false), 900)
  }

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
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-slate-950 p-4 overflow-hidden">
      <WaxLogoFilter />

      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-[#d4a038]/8 rounded-full blur-[120px] pointer-events-none" />

      {/* Seal + header — always visible, animates in */}
      <motion.div
        className="text-center mb-8 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Wax Seal */}
        <motion.div
          animate={scaleControls}
          className="inline-block mb-5 cursor-pointer select-none"
          onClick={handleSealClick}
          title="Klick mich 👀"
        >
          <motion.div
            initial={{ rotate: -30 }}
            animate={rotateControls}
            style={{
              filter: glowing
                ? 'drop-shadow(0 0 28px rgba(212,160,56,1)) drop-shadow(0 0 60px rgba(212,160,56,0.55))'
                : 'drop-shadow(0 0 18px rgba(212,160,56,0.7))',
              transition: 'filter 0.3s ease',
            }}
          >
            <Image
              src="/brand/collectr-r.png"
              alt="CollectR Wachssiegel"
              width={100}
              height={100}
              priority
              style={{ filter: 'url(#wax-remove-white)', display: 'block' }}
            />
          </motion.div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-2xl sm:text-3xl font-bold text-white"
        >
          CollectR
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          className="text-sm sm:text-base text-white/40 mt-1.5"
        >
          Melde dich an
        </motion.p>
      </motion.div>

      {/* Form — slides in after intro */}
      <AnimatePresence>
        {formVisible && (
          <motion.div
            className="relative w-full max-w-md z-10"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
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
                <Link
                  href="/register"
                  className="text-[#d4a038] hover:text-[#e8b84a] transition-colors"
                >
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
