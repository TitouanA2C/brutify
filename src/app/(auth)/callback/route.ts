import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isSafeRedirectPath } from '@/lib/security'

const DEFAULT_NEXT = '/dashboard'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const nextParam = searchParams.get('next') ?? DEFAULT_NEXT
  const next = isSafeRedirectPath(nextParam) ? nextParam : DEFAULT_NEXT

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
