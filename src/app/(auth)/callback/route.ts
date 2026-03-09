import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isSafeRedirectPath } from '@/lib/security'

const DEFAULT_NEXT = '/dashboard'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const nextParam = searchParams.get('next') ?? DEFAULT_NEXT
  const next = isSafeRedirectPath(nextParam) ? nextParam : DEFAULT_NEXT

  // Sur Vercel, request.url peut contenir une URL interne.
  // x-forwarded-host contient le vrai domaine public.
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https'
  const origin = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : new URL(request.url).origin

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }

    console.error('[callback] exchangeCodeForSession error:', error.message)
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
