'use server'

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * joinWaitlist — server action for the /upgrade waitlist form
 *
 * Security note (ADR-security-001):
 * - user_id is derived server-side from the verified JWT session, never from form data.
 * - The page is accessible to non-authenticated users (SEO / tool traffic) so
 *   user_id is optional — anonymous submissions are valid.
 * - Uses admin client for the insert because the waitlist table has no RLS
 *   (public insert is safer via server action than exposed anon key).
 */
export async function joinWaitlist(formData) {
  const email = (formData.get('email') || '').trim().toLowerCase()

  if (!email || !email.includes('@')) {
    return { error: 'Please enter a valid email address.' }
  }

  // Derive user_id server-side — never trust it from client form data
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id ?? null

  const { error } = await supabaseAdmin
    .from('waitlist')
    .insert({ email, user_id: userId })

  if (error) {
    // 23505 = unique_violation — already on the list
    if (error.code === '23505') {
      return { alreadyJoined: true }
    }
    console.error('[waitlist] insert error:', error.message)
    return { error: 'Something went wrong. Please try again.' }
  }

  return { success: true }
}
