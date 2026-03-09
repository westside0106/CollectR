'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ThemeToggle } from '@/components/ThemeToggle'

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-slate-900/90 backdrop-blur-xl border-b border-white/8 shadow-[0_1px_40px_rgba(0,0,0,0.4)]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12 lg:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src="/brand/collectr-hero.png"
              alt="Collectorssphere"
              width={28}
              height={28}
              className="rounded-xl group-hover:scale-105 transition-transform duration-200"
            />
            <span className="font-bold text-white text-lg hidden sm:block tracking-tight">
              Collectors<span className="text-[#d4a038]">sphere</span>
            </span>
          </Link>

          {/* Desktop CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            <ThemeToggle variant="header" />
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white border border-white/15 hover:border-white/35 rounded-xl transition-all duration-200 hover:bg-white/5"
            >
              Anmelden
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm font-semibold bg-[#d4a038] hover:bg-[#e8b84a] text-slate-950 rounded-xl transition-all duration-200 shadow-[0_0_20px_rgba(212,160,56,0.35)] hover:shadow-[0_0_35px_rgba(212,160,56,0.55)]"
            >
              Kostenlos starten
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="sm:hidden p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all"
            aria-label="Menü"
          >
            {mobileOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-white/10 bg-slate-900/95 backdrop-blur-xl px-4 py-5 space-y-3">
          <Link
            href="/login"
            className="block w-full text-center py-3.5 text-white/80 font-medium border border-white/20 rounded-xl hover:bg-white/5 transition"
          >
            Anmelden
          </Link>
          <Link
            href="/register"
            className="block w-full text-center py-3.5 font-semibold bg-[#d4a038] text-slate-950 rounded-xl shadow-[0_0_20px_rgba(212,160,56,0.4)]"
          >
            Kostenlos starten →
          </Link>
        </div>
      )}
    </nav>
  )
}
