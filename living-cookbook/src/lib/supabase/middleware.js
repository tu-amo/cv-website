import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function updateSession(request) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
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

  // IMPORTANT: DO NOT REMOVE THIS! 
  // It refreshes the session if it's expired.
  const { data: { user } } = await supabase.auth.getUser()

  // Authentication & Route Protection
  const url = new URL(request.url)
  const isPublicRoute = 
    url.pathname.startsWith('/login') ||
    url.pathname.startsWith('/signup') ||           // sign-up page — must be accessible before auth
    url.pathname.startsWith('/public') ||
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/auth/callback') || // Email confirmation handler
    url.pathname.startsWith('/join') ||           // Invite link handler
    url.pathname.startsWith('/api/nutrition')     // USDA nutrition proxy — called from public recipe page too
    // Note: /login/forgot-password and /login/reset-password are covered by /login prefix
    // Note: /signup/* is covered by /signup prefix

  
  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return supabaseResponse
}
