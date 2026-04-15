import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * /auth/callback
 * Handles two Supabase email link formats:
 *   1. token_hash + type  → email confirmation, magic link, password recovery
 *   2. code               → PKCE OAuth flows
 */
export async function GET(request) {
    const { searchParams, origin } = new URL(request.url);
    const token_hash = searchParams.get('token_hash');
    const type = searchParams.get('type');       // 'email', 'recovery', 'magiclink'
    const code = searchParams.get('code');       // PKCE OAuth
    const next = searchParams.get('next') ?? '/';

    const supabase = await createClient();

    // ── Format 1: Email OTP (confirmation, recovery) ──────────────────────
    if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({ token_hash, type });
        if (!error) {
            // Email confirmation → tell the user they're confirmed and prompt sign-in
            if (type === 'email' || type === 'signup') {
                return NextResponse.redirect(`${origin}/login?confirmed=true`);
            }
            // Password recovery → redirect to reset page
            const destination = type === 'recovery' ? '/login/reset-password' : next;
            return NextResponse.redirect(`${origin}${destination}`);
        }
        return NextResponse.redirect(
            `${origin}/login?error=${encodeURIComponent('Your confirmation link has expired. Please sign up again.')}`
        );
    }

    // ── Format 2: PKCE code exchange ──────────────────────────────────────
    if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            return NextResponse.redirect(`${origin}${next}`);
        }
        return NextResponse.redirect(
            `${origin}/login?error=${encodeURIComponent('Could not verify your session. Please try again.')}`
        );
    }

    // Fallback — neither param present
    return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent('Invalid confirmation link.')}`
    );
}
