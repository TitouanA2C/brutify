import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const PUBLIC_ROUTES = ['/', '/login', '/signup', '/callback']

function forwardCookies(
  from: NextResponse,
  to: NextResponse
): NextResponse {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie.name, cookie.value)
  })
  return to
}

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user, supabase } = await updateSession(request)
  const { pathname } = request.nextUrl

  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup')
  const isAppRoute =
    !isAuthRoute &&
    !pathname.startsWith('/callback') &&
    !PUBLIC_ROUTES.includes(pathname) &&
    !pathname.startsWith('/_next') &&
    !pathname.startsWith('/api')

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return forwardCookies(supabaseResponse, NextResponse.redirect(url))
  }

  if (isAppRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return forwardCookies(supabaseResponse, NextResponse.redirect(url))
  }

  if (user && isAppRoute && pathname !== '/onboarding') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single()

    if (profile && profile.onboarding_completed === false) {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'
      return forwardCookies(supabaseResponse, NextResponse.redirect(url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
