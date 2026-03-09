import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getSession() lit les cookies localement et gère le refresh du token
  // sans faire d'appel HTTP vers le serveur Supabase Auth.
  // getUser() faisait un appel réseau à chaque navigation : sur Vercel Edge,
  // un timeout ou échec renvoyait user=null → redirection vers /login.
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError) {
    console.error('[middleware] getSession error:', sessionError.message)
  }

  const user = session?.user ?? null

  if (!user) {
    const cookieNames = request.cookies.getAll().map((c) => c.name)
    const hasAuthCookie = cookieNames.some((n) => n.startsWith('sb-') && n.includes('-auth-token'))
    if (hasAuthCookie) {
      console.warn('[middleware] auth cookies present but session is null', {
        cookies: cookieNames.filter((n) => n.startsWith('sb-')),
      })
    }
  }

  return { supabaseResponse, user, supabase }
}
