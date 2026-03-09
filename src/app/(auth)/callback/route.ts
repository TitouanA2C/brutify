import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/lib/supabase/types'
import { isSafeRedirectPath } from '@/lib/security'

const DEFAULT_NEXT = '/dashboard'

/**
 * Les cookies de session doivent être attachés à la réponse qu’on retourne.
 * Si on utilise cookies().set() puis NextResponse.redirect(), les Set-Cookie
 * ne sont pas envoyés au navigateur → session perdue après la 1ère navigation.
 * On crée donc la réponse de redirect d’abord et on y écrit les cookies.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const nextParam = searchParams.get('next') ?? DEFAULT_NEXT
  const next = isSafeRedirectPath(nextParam) ? nextParam : DEFAULT_NEXT

  const redirectUrl = code ? `${origin}${next}` : `${origin}/login?error=auth_callback_error`
  const response = NextResponse.redirect(redirectUrl)

  if (code) {
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
    }
  }

  return response
}
