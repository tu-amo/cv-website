---
name: nextjs-supabase-auth
version: 2.0.0
description: "Production-grade Supabase Auth integration with Next.js App Router. Covers SSR client setup, middleware, auth callback (both email OTP and PKCE), persistent layout auth tracking, profiles table, password reset, and invite link flows. Use when: supabase auth next.js, login supabase, auth middleware, protected routes, email confirmation, forgot password, invite link, display name."
source: living-cookbook project (tu-amo) — distilled from LESSONS_LEARNT.md LL-003, LL-007, LL-008, LL-012, LL-013, LL-032
supersedes: nextjs-supabase-auth v2.0.0
---

# Next.js + Supabase Auth — v2

Real-world patterns for integrating Supabase Auth with Next.js App Router.
Distilled from production debugging — covers the failure modes the v1 skeleton misses.

---

## 1. Client Setup

Three clients are required — one per context.

### Server Component / Server Action client
```js
// src/lib/supabase/server.js
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options))
          } catch {} // Safe to ignore in read-only Server Component contexts
        },
      },
    }
  )
}
```

### Client Component client
```js
// src/lib/supabase/client.js
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}
```

### Middleware client
```js
// src/lib/supabase/middleware.js
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function updateSession(request) {
  let supabaseResponse = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )
  // CRITICAL: Do not remove — refreshes expired sessions
  const { data: { user } } = await supabase.auth.getUser()

  const url = new URL(request.url)
  const isPublicRoute =
    url.pathname.startsWith('/login') ||
    url.pathname.startsWith('/auth/callback') || // ← MUST be public
    url.pathname.startsWith('/join') ||           // ← Invite links
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/public')

  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  return supabaseResponse
}
```

---

## 2. Auth Callback Route — CRITICAL PATTERN

> ⚠️ **The #1 failure mode in auth setups.** Supabase uses TWO different URL formats
> depending on the flow. Both must be handled in one route handler.

```
Email confirmation / password reset → token_hash + type params
OAuth (Google, GitHub, etc.)        → code param (PKCE)
```

```js
// src/app/auth/callback/route.js
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash') // email OTP format
  const type       = searchParams.get('type')        // 'email' | 'recovery' | 'magiclink'
  const code       = searchParams.get('code')        // PKCE OAuth format
  const next       = searchParams.get('next') ?? '/'

  const supabase = await createClient()

  // ── Format 1: Email OTP ─────────────────────────────────────
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })
    if (!error) {
      const destination = type === 'recovery' ? '/login/reset-password' : next
      return NextResponse.redirect(`${origin}${destination}`)
    }
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('Confirmation link expired. Please try again.')}`
    )
  }

  // ── Format 2: PKCE code exchange ────────────────────────────
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${next}`)
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('Could not verify session.')}`
    )
  }

  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('Invalid link.')}`)
}
```

**Also add to `/auth/callback` to Supabase Redirect URLs:**
```
http://localhost:3000/**
https://your-production-domain/**
```

---

## 3. Auth State in Persistent Layouts

> ⚠️ **Second major failure mode.** In a persistent layout (one that never unmounts),
> `supabase.auth.onAuthStateChange` does NOT fire when auth is changed via server actions
> (cookies). The component mounts once and never re-checks.

**Fix:** Use `usePathname()` as a `useEffect` dependency to re-check the session on every navigation.

```js
// src/components/AuthStatus.js
"use client"
import { useEffect, useState, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthStatus() {
  const [user, setUser] = useState(null)
  const [displayName, setDisplayName] = useState(null)
  const supabase = useMemo(() => createClient(), [])
  const pathname = usePathname() // ← the fix

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .maybeSingle()
        setDisplayName(profile?.display_name ?? user.email.split('@')[0])
      } else {
        setDisplayName(null)
      }
    }
    getUser()
  }, [supabase, pathname]) // ← pathname re-triggers check on every route change
}
```

---

## 4. Server Actions for Login / Signup

```js
// src/app/login/actions.js
'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData) {
  const supabase = await createClient()
  const next = formData.get('next') || '/'
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`)
  revalidatePath('/', 'layout')
  redirect(next) // ← honour ?next= for invite link flows
}

export async function signup(formData) {
  const supabase = await createClient()
  const next = formData.get('next') || '/'
  const displayName = (formData.get('display_name') || '').trim()

  const { data, error } = await supabase.auth.signUp({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`)

  // ⚠️ IMPORTANT: Use supabaseAdmin for the profile upsert, NOT the session client.
  // supabase.auth.signUp() does NOT issue a session before email confirmation.
  // Without a session, auth.uid() returns null and any RLS-protected INSERT
  // on profiles is silently rejected. The user.id is safe — it comes from
  // Supabase's own signUp() response, not user-supplied. (LL-032, ADR-014)
  if (data?.user && displayName) {
    const { supabaseAdmin } = await import('@/lib/supabase/admin')
    await supabaseAdmin.from('profiles').upsert(
      { id: data.user.id, display_name: displayName },
      { onConflict: 'id' }
    )
  }

  // ← Don't redirect to /. User must confirm email first.
  redirect(`/login?confirmation=pending${next !== '/' ? `&next=${encodeURIComponent(next)}` : ''}`)
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
```

---

## 5. Profiles Table (Display Names)

Decouple user identity from email. Required for any multi-user or household feature.

```sql
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT timezone('utc', now())
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_read"   ON profiles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (id = auth.uid());

-- Auto-create profile on signup (fallback display_name = email prefix)
CREATE OR REPLACE FUNCTION create_profile_on_signup()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (NEW.id, split_part(NEW.email, '@', 1))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_profile_on_signup();

-- Backfill existing users
INSERT INTO profiles (id, display_name)
SELECT id, split_part(email, '@', 1) FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;
```

---

## 6. Password Reset Flow

```
/login/forgot-password  → supabase.auth.resetPasswordForEmail(email, { redirectTo: origin + '/auth/callback?type=recovery' })
/auth/callback          → verifyOtp({ token_hash, type: 'recovery' }) → redirect /login/reset-password
/login/reset-password   → supabase.auth.updateUser({ password })
```

**Always build this alongside initial auth — not as an afterthought.**

---

## 7. Invite Link Flow (?next= preservation)

For household/org invite systems:

1. Invite link: `/join/[code]`
2. Middleware marks `/join` as public
3. `/join/[code]` Server Component checks auth — if not logged in: `redirect('/login?next=/join/' + code)`
4. Login form passes `next` as `<input type="hidden" name="next" value={next} />`
5. Login action: `redirect(next)` after success
6. `/join/[code]` completes the membership insert

---

## Anti-Patterns

| ❌ Anti-Pattern | ✅ Correct |
|---|---|
| Auth callback only handles `code` | Handle both `token_hash` AND `code` |
| `onAuthStateChange` in persistent layout | Use `usePathname()` as useEffect dep |
| `redirect('/')` after signup | `redirect('/login?confirmation=pending')` |
| Email prefix as display name in DB | `profiles` table with trigger |
| `/auth/callback` not in public middleware routes | Always whitelist it |
| Forgot password not built on day 1 | Build it with initial auth |
| `.update()` on a row that may not exist | Always use `.upsert()` for profile writes |
| Trigger INSERT blocked by RLS (`auth.uid()` is NULL in trigger context) | Wrap trigger body in `EXCEPTION WHEN OTHERS` — never let a trigger block signup |
| Dropping an INSERT policy to fix a trigger | Drop + re-add after making trigger exception-safe; audit all dependants of any policy change |
| **⚠️ Middleware file named `proxy.js`, `handler.js`, or anything other than `middleware.js`** | **MUST be `src/middleware.js` with `export function middleware`. Next.js will silently ignore any other filename. Sessions will NOT refresh, routes will NOT be protected — no error is thrown.** |
| **⚠️ Using default `{{ .ConfirmationURL }}` in Supabase email templates** | **Redirects to bare Site URL; tokens arrive as hash fragments that SSR cannot read. Use `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=[TYPE]` in all three templates (LL-025)** |
| **⚠️ Relying on Supabase built-in email service for production** | **3 emails/hour rate limit. Use Resend (or any real SMTP provider) from day one. Rate limit causes silent delivery failure with no app-side error (LL-026)** |
| Magic link user has no path to set a password | After magic link login, direct user to `/login/reset-password` — `supabase.auth.updateUser({ password })` works for any authenticated session, no recovery token required (LL-028) |
| **⚠️ Profile upsert in signup using the session client** | **`supabase.auth.signUp()` does NOT issue a session before email confirmation. `auth.uid()` returns null; the INSERT is silently rejected by RLS. Use `supabaseAdmin` with the user ID from `signUpData.user.id` (LL-032, ADR-014)** |

---

## Supabase Dashboard Checklist

- [x] Site URL set correctly — **must be the production URL before first real user** (`http://localhost:3000` is the Supabase default — update it on launch day; LL-029)
- [x] Redirect URLs include both `http://localhost:3000/**` and production URL
- [x] Email confirmation enabled in Auth settings
- [x] `profiles` table created with trigger and RLS policies
- [x] `get_my_group_ids()` SECURITY DEFINER function active
- [x] **Email templates updated** — ALL THREE templates (Confirm Signup, Magic Link, Reset Password) must use `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=[TYPE]` NOT the default `{{ .ConfirmationURL }}` (LL-025)
- [x] **Custom SMTP configured** — Supabase built-in email has a 3/hour rate limit. Configure Resend or equivalent before any real users attempt signup (LL-026)
- [ ] **Email template branded** — update copy and styling in Supabase Dashboard → Authentication → Email Templates
