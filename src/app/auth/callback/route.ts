import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Validate redirect path to prevent open redirect attacks
function getSafeRedirectPath(next: string | null): string {
  if (!next) return '/'
  // Must start with / but not // (protocol-relative URL)
  // Must not contain : before first / (no protocol)
  if (next.startsWith('/') && !next.startsWith('//') && !next.includes(':')) {
    return next
  }
  return '/'
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = getSafeRedirectPath(searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Fehler: Redirect zu Login
  return NextResponse.redirect(`${origin}/login?error=auth`)
}
