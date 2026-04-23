'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
// ADR-007 (updated 2026-04-19): supabaseAdmin profile upsert removed.
// Profile creation is now handled by the on_auth_user_created PostgreSQL trigger
// (migration 20260419090000). The trigger reads display_name from
// raw_user_meta_data and inserts into public.profiles with SECURITY DEFINER.


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

  // TD-3: Server-side display_name length guard (100-char limit)
  if (displayName.length > 100) {
    redirect(`${errorOrigin}?error=${encodeURIComponent('Your name must be 100 characters or fewer.')}${next !== '/' ? `&next=${encodeURIComponent(next)}` : ''}`)
  }

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

  // Profile row is created automatically by the on_auth_user_created
  // PostgreSQL trigger (migration 20260419090000). No admin client needed.

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
