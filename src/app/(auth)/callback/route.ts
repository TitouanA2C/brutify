import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { isSafeRedirectPath } from '@/lib/security'

const DEFAULT_NEXT = '/dashboard'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const nextParam = searchParams.get('next') ?? DEFAULT_NEXT
  const next = isSafeRedirectPath(nextParam) ? nextParam : DEFAULT_NEXT

  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https'
  const origin = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : new URL(request.url).origin

  const redirectUrl = `${origin}${next}`
  const errorUrl = `${origin}/login?error=auth_callback_error`

  if (code) {
    const response = NextResponse.redirect(redirectUrl)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      console.log('[callback] session exchanged, redirecting to', redirectUrl)
      return response
    }

    console.error('[callback] exchangeCodeForSession error:', error.message)
  }

  return NextResponse.redirect(errorUrl)
}
