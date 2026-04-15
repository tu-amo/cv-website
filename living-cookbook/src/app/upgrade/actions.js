'use server'

import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * joinWaitlist — server action for the /upgrade waitlist form
 *
 * Uses admin client because:
 * - The page is accessible to non-authenticated users (SEO / tool traffic)
 * - The waitlist table has no RLS (public insert is handled server-side)
 * - We append the user_id if the session is available, but don't require it
 */
export async function joinWaitlist(formData) {
  const email  = (formData.get('email') || '').trim().toLowerCase()
  const userId = formData.get('user_id') || null

  if (!email || !email.includes('@')) {
    return { error: 'Please enter a valid email address.' }
  }

  const { error } = await supabaseAdmin
    .from('waitlist')
    .insert({ email, user_id: userId || null })

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
