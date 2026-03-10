import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // WICHTIG: Session bei jedem Request aktualisieren
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Eingeloggte User auf Landing Page → weiter zum Dashboard
  if (user && request.nextUrl.pathname === '/') {
  const { pathname } = request.nextUrl

  // / ist öffentlich (Landing Page) — eingeloggte User → Dashboard
  if (pathname === '/' && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Geschützte Routen - wenn nicht eingeloggt, redirect zu Login
  const protectedPaths = ['/dashboard', '/collections']
  const isProtectedPath = protectedPaths.some(path =>
    request.nextUrl.pathname === path ||
    request.nextUrl.pathname.startsWith(path + '/')
  )

  if (isProtectedPath && !user) {
  // Geschützte Routen
  const protectedPaths = ['/dashboard', '/collections']
  const isProtectedPath = protectedPaths.some(path =>
    pathname === path || pathname.startsWith(path + '/')
  )

  // Ausnahme: Tools-Bereich ist öffentlich
  const isToolsPath = pathname.startsWith('/tools')

  if (isProtectedPath && !isToolsPath && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Eingeloggt auf Login/Register → Dashboard
  if (user && (pathname === '/login' || pathname === '/register')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
