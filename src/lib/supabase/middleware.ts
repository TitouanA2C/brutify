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
  } = await supabase.auth.getSession()

  const user = session?.user ?? null

  return { supabaseResponse, user, supabase }
}
