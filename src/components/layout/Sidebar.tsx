'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserMenu } from '@/components/UserMenu'

export function Sidebar() {
  const pathname = usePathname()

  // Nicht auf Login/Register Seiten zeigen
  if (pathname === '/login' || pathname === '/register') {
    return null
  }

  const links = [
    { href: '/', label: 'Dashboard', icon: '📊' },
    { href: '/collections', label: 'Sammlungen', icon: '📦' },
  ]

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col">
      {/* Logo / Brand */}
      <div className="p-6 border-b border-slate-700">
        <Link href="/" className="flex items-center gap-3">
          <img
            src="/brand/collectr-r.png"
            alt="CollectR"
            width={28}
            height={28}
            className="block"
          />
          <div>
            <h1 className="text-xl font-bold leading-none">CollectR</h1>
            <p className="text-xs text-slate-400">Deine Sammlungen</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {links.map(link => {
            const isActive = pathname === link.href
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User Menu */}
      <div className="p-4 border-t border-slate-700">
        <UserMenu />
      </div>
    </aside>
  )
}