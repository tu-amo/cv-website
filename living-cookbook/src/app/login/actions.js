'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
// ADR-007: supabaseAdmin used here deliberately — profile creation at signup requires bypassing RLS.
// The regular Supabase client has no session before email confirmation (auth.uid() returns null),
// so there is no valid JWT to satisfy the INSERT policy on the profiles table.
// The user.id written here comes from Supabase's own signUp() response — it cannot be spoofed.
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function login(formData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const next = formData.get('next') || '/'

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}${next !== '/' ? `&next=${encodeURIComponent(next)}` : ''}`)
  }

  revalidatePath('/', 'layout')
  redirect(next)
}

export async function signup(formData) {
  const supabase = await createClient()

  const email        = formData.get('email')
  const password     = formData.get('password')
  const displayName  = (formData.get('display_name') || '').trim()
  const next         = formData.get('next') || '/'
  // error_origin lets the signup page redirect errors back to /signup
  // instead of /login (set as a hidden field in the form)
  const errorOrigin  = formData.get('error_origin') || '/login'

  // Pass display_name in auth metadata so it's in the JWT immediately,
  // even before the profiles row is confirmed/readable via RLS.
  const { data: signUpData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName || null },
    },
  })

  if (error) {
    redirect(`${errorOrigin}?error=${encodeURIComponent(error.message)}${next !== '/' ? `&next=${encodeURIComponent(next)}` : ''}`)
  }

  // Upsert the profile using admin client — the regular client has no session
  // at signup time (email not yet confirmed) so RLS blocks the insert.
  if (signUpData?.user && displayName) {
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({ id: signUpData.user.id, display_name: displayName })
    if (profileError) {
      console.error('[signup] profile upsert failed:', profileError.message)
    }
  }

  // ── Detect user_repeated_signup ─────────────────────────────────────────────
  // Supabase never returns an error when the email already exists (prevents
  // email enumeration). Instead it silently returns user.identities = [].
  // Redirect to /login with a helpful message rather than a "check your inbox"
  // screen that will never deliver an email.
  if (signUpData?.user?.identities?.length === 0) {
    redirect(`/login?error=${encodeURIComponent('Looks like you already have an account — sign in below.')}${next !== '/' ? `&next=${encodeURIComponent(next)}` : ''}`)
  }

  // Show "check your inbox" screen
  const nextParam = next !== '/' ? `&next=${encodeURIComponent(next)}` : ''
  redirect(`${errorOrigin}?confirmation=pending${nextParam}`)
}

export async function logout() {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Logout error:', error)
  }

  revalidatePath('/', 'layout')
  redirect('/login')
}
