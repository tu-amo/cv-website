// FRAMEWORK CONSTRAINT: This file MUST be named `middleware.js` at the `src/` root.
// Next.js silently ignores any other filename — no error, no warning, no route protection.
// Do NOT rename this file. See docs/architecture/ADR-011-middleware-file-naming-convention.md
import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  const { pathname } = new URL(request.url)

  // Allow unauthenticated access to the homepage (shows Public tab to guests)
  if (pathname === '/') return NextResponse.next()

  // Allow unauthenticated access to all free tools (SEO pages — no user data)
  if (pathname.startsWith('/tools/') || pathname === '/tools') return NextResponse.next()

  // Allow crawlers and browsers to access sitemap + robots without auth
  if (pathname === '/sitemap.xml' || pathname === '/robots.txt') return NextResponse.next()

  // Allow public recipe pages (unauthenticated viewers)
  if (pathname.startsWith('/public/')) return NextResponse.next()

  // Allow login + signup pages (obviously must be public)
  if (pathname.startsWith('/login') || pathname.startsWith('/signup')) return NextResponse.next()

  // Allow the upgrade/waitlist page — accessible to all traffic including tool visitors
  if (pathname.startsWith('/upgrade')) return NextResponse.next()

  return await updateSession(request)

}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
