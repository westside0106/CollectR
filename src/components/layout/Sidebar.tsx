'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { UserMenu } from '@/components/UserMenu'
import { ThemeToggle } from '@/components/ThemeToggle'

export function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  // Schließen wenn Route wechselt
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Body scroll lock wenn Sidebar offen
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Nicht auf Login/Register Seiten zeigen (NACH den Hooks!)
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
      {/* Mobile Header Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900 text-white h-14 flex items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/brand/collectr-hero.png"
            alt="CollectR"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="font-bold">CollectR</span>
        </Link>
        
        {/* Hamburger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Menu öffnen"
        >
          {isOpen ? (
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

      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-slate-900 text-white flex flex-col
          transform transition-transform duration-300 ease-in-out
          lg:transform-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo - Desktop */}
        <div className="hidden lg:block p-6 border-b border-slate-700">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/brand/collectr-hero.png"
              alt="CollectR"
              width={44}
              height={44}
              className="rounded-lg"
            />
            <div>
              <h1 className="text-xl font-bold">CollectR</h1>
              <p className="text-xs text-slate-400">Deine Sammlungen</p>
            </div>
          </Link>
        </div>

        {/* Mobile: Spacer für Header */}
        <div className="lg:hidden h-14 border-b border-slate-700" />

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          {/* Haupt-Navigation */}
          <ul className="space-y-1">
            {mainLinks.map(link => {
              const isActive = pathname === link.href
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-blue-600 text-white' 
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span className="text-lg">{link.icon}</span>
                    <span className="font-medium">{link.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>

          {/* Trennlinie */}
          <div className="my-4 border-t border-slate-700" />

          {/* Tools */}
          <p className="px-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Tools
          </p>
          <ul className="space-y-1">
            {toolLinks.map(link => {
              const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-blue-600 text-white' 
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span className="text-lg">{link.icon}</span>
                    <span className="font-medium">{link.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Theme Toggle */}
        <div className="px-4 py-2">
          <ThemeToggle />
        </div>

        {/* User Menu */}
        <div className="p-4 border-t border-slate-700">
          <UserMenu />
        </div>
      </aside>
    </>
  )
}
