'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { UserMenu } from '@/components/UserMenu'
import { ThemeToggle } from '@/components/ThemeToggle'
import { SphereNavigation } from '@/components/shared/SphereNavigation'

export function TopHeader() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Schließen wenn Route wechselt
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  // Body scroll lock wenn Mobile Menu offen
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])

  // Nicht auf Login/Register Seiten zeigen
  if (pathname === '/login' || pathname === '/register') {
    return null
  }

  const mainLinks = [
    { href: '/', label: 'Dashboard', icon: '📊' },
    { href: '/collections', label: 'Sammlungen', icon: '📦' },
  ]

  const toolLinks = [
    { href: '/tools/currency', label: 'Währungsrechner', icon: '💱' },
    { href: '/tools/market', label: 'Marktnews', icon: '📈' },
    { href: '/tools/news', label: 'Sammler-News', icon: '📰' },
    { href: '/tools/books', label: 'Bücher-Suche', icon: '📚' },
    { href: '/tools/vinyl', label: 'Vinyl-Suche', icon: '💿' },
  ]

  return (
    <>
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
        <div className="h-16 px-4 lg:px-6 flex items-center justify-between gap-4">
          {/* Logo - Links */}
          <Link href="/" className="flex items-center gap-3 flex-shrink-0">
            <Image
              src="/brand/collectr-hero.png"
              alt="CollectR"
              width={36}
              height={36}
              className="rounded-lg"
            />
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">Collectorssphere</h1>
            </div>
          </Link>

          {/* Sphere Navigation - Desktop */}
          <div className="hidden lg:block flex-shrink-0">
            <SphereNavigation />
          </div>

          {/* Desktop Navigation - Mitte */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 max-w-2xl">
            {mainLinks.map(link => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="text-lg">{link.icon}</span>
                  <span className="text-sm">{link.label}</span>
                </Link>
              )
            })}

            {/* Tools Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium text-sm">
                <span className="text-lg">🛠️</span>
                <span>Tools</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              <div className="absolute left-0 top-full mt-1 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-600 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                {toolLinks.map(link => {
                  const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span className="text-lg">{link.icon}</span>
                      <span>{link.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          </nav>

          {/* Right Section - User Menu + Theme + Hamburger */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Theme Toggle - Desktop */}
            <div className="hidden sm:block">
              <ThemeToggle variant="header" />
            </div>

            {/* User Menu - Desktop & Mobile */}
            <UserMenu />

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Menü öffnen"
            >
              {isMobileMenuOpen ? (
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
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            style={{ top: '64px' }}
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Mobile Slide-in Menu */}
          <div
            className="lg:hidden fixed top-16 right-0 bottom-0 z-50 w-80 max-w-[85vw] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 shadow-2xl overflow-y-auto"
          >
            <nav className="p-4">
              {/* Sphere Navigation - Mobile */}
              <div className="mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
                <p className="px-4 mb-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Spheres
                </p>
                <SphereNavigation />
              </div>

              {/* Main Links */}
              <div className="space-y-1 mb-6">
                <p className="px-4 mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Navigation
                </p>
                {mainLinks.map(link => {
                  const isActive = pathname === link.href
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-xl">{link.icon}</span>
                      <span className="font-medium">{link.label}</span>
                    </Link>
                  )
                })}
              </div>

              {/* Tools */}
              <div className="space-y-1">
                <p className="px-4 mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Tools
                </p>
                {toolLinks.map(link => {
                  const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-xl">{link.icon}</span>
                      <span className="font-medium">{link.label}</span>
                    </Link>
                  )
                })}
              </div>

              {/* Theme Toggle - Mobile */}
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 sm:hidden">
                <ThemeToggle />
              </div>
            </nav>
          </div>
        </>
      )}

      {/* Spacer to prevent content from going under fixed header */}
      <div className="h-16" />
    </>
  )
}
