# Auth Flow Manual Test Checklist
**Last Updated:** 2026-04-06  
**Run after:** any auth-related change, SMTP config update, or email template change  
**Production URL:** https://living-cookbook.vercel.app

Use an **incognito window** for all tests so sessions don't interfere with each other.

---

## Pre-flight Checks

Before starting, verify:
- [ ] Supabase Site URL is set to `https://living-cookbook.vercel.app` (not localhost)
- [ ] All 3 email templates updated to use `/auth/callback?token_hash=...` format
- [ ] Resend SMTP is active (check Supabase → Project Settings → Auth → SMTP Settings)
- [ ] Resend dashboard shows domain `janeblog.com` as Verified

---

## Test 1 — Create User (New Signup)

**Goal:** New user can sign up, confirm via email, and log in.

| Step | Action | Expected Result | ✓/✗ |
|------|--------|----------------|------|
| 1.1 | Open incognito → go to `/login` | Login page loads | |
| 1.2 | Click "Sign up" / switch to signup tab | Signup form visible | |
| 1.3 | Enter a real email you can check + strong password → Submit | "Check your inbox" screen shown | |
| 1.4 | Check inbox for confirmation email | Email arrives within 60 seconds, from `noreply@janeblog.com`, sender name "The Living Cookbook" | |
| 1.5 | Check email is NOT in spam | Inbox, not spam | |
| 1.6 | Click the confirmation link in the email | Browser opens → `/auth/callback` → redirected to app (homepage or `/`) | |
| 1.7 | Verify you are logged in | Avatar / username visible in nav, NOT redirected to `/login` | |
| 1.8 | Log out | Redirected to `/login` | |
| 1.9 | Log back in with email + password | Logged in successfully | |

**Failure signals:**
- Email doesn't arrive → Check Resend dashboard → Logs
- Link sends to `/login` without logging in → Email template not updated
- Link goes to `localhost:3000` → Site URL not updated in Supabase

---

## Test 2 — Reset Password

**Goal:** User can reset a forgotten password and log in with the new one.

| Step | Action | Expected Result | ✓/✗ |
|------|--------|----------------|------|
| 2.1 | Open incognito → go to `/login/forgot-password` | Forgot password form loads | |
| 2.2 | Enter email of existing confirmed account → Submit | "Check your inbox" screen shown | |
| 2.3 | Check inbox | Reset email arrives within 60 seconds, from `noreply@janeblog.com` | |
| 2.4 | Click the reset link | Browser opens → `/auth/callback?token_hash=...&type=recovery` → redirected to `/login/reset-password` | |
| 2.5 | Enter new password + confirm → Submit | "Password updated!" success message | |
| 2.6 | Redirected to homepage after 2 seconds | Logged in automatically | |
| 2.7 | Log out | Back at `/login` | |
| 2.8 | Log in with the **new** password | Logged in successfully | |
| 2.9 | Verify the **old** password no longer works | "Invalid login credentials" error | |

**Failure signals:**
- Can't log in with new password → Recovery link didn't properly route through `/auth/callback`; `updateUser` may have run without a valid recovery session

---

## Test 3 — Join Household (First-Time User)

**Goal:** A brand-new user who has never seen the app can receive an invite link, sign up, and join the household in one flow.

| Step | Action | Expected Result | ✓/✗ |
|------|--------|----------------|------|
| 3.1 | Open incognito | Fresh session, no cookies | |
| 3.2 | Navigate to `/join/efd4ed59` | Redirected to `/login?next=/join/efd4ed59` | |
| 3.3 | Click "Sign up" tab on login page | Signup form visible | |
| 3.4 | Sign up with a new email | "Check your inbox" pending screen | |
| 3.5 | Confirm email via link | Session established | |
| 3.6 | After confirmation, go to `/join/efd4ed59` | "Welcome to the kitchen! You have joined [household name]" ✅ | |
| 3.7 | Click "Go to Household →" | Household page loads, user is a member | |
| 3.8 | In Supabase → group_members | New user_id row present for this group | |

**Note:** Steps 3.5 → 3.6 may require manually navigating to `/join/efd4ed59` after email confirmation if the `?next=` redirect doesn't auto-complete (depends on confirmation email template `next` parameter support).

---

## Test 4 — Join Household (Existing Logged-In User)

**Goal:** An existing user who already has an account can join a household via invite link.

| Step | Action | Expected Result | ✓/✗ |
|------|--------|----------------|------|
| 4.1 | Log in as an existing user (not yet in the household) | Successfully logged in | |
| 4.2 | Navigate to `/join/efd4ed59` | "Welcome to the kitchen!" join page shown (no login redirect) | |
| 4.3 | Click "Go to Household →" | Household page loads | |
| 4.4 | Navigate to `/join/efd4ed59` again | "Already in this kitchen" message shown (no duplicate insert) | |
| 4.5 | In Supabase → group_members | Only ONE row for this user + group (no duplicates) | |

---

## Test 5 — Change Password (While Logged In)

**Goal:** A logged-in user can change their own password without needing a reset email.

| Step | Action | Expected Result | ✓/✗ |
|------|--------|----------------|------|
| 5.1 | Log in normally | Logged in | |
| 5.2 | Navigate to `/login/reset-password` directly | Form loads (no error, no redirect to login) | |
| 5.3 | Enter new password + confirm → Submit | "Password updated!" success message | |
| 5.4 | Log out | At `/login` | |
| 5.5 | Log in with **new** password | Success | |
| 5.6 | **Old** password no longer works | "Invalid login credentials" | |

---

## Sign-Off

| Test | Result | Tester | Date |
|------|--------|--------|------|
| Test 1 — Create User | | | |
| Test 2 — Reset Password | | | |
| Test 3 — Join (new user) | | | |
| Test 4 — Join (existing user) | | | |
| Test 5 — Change Password | | | |

All 5 tests must pass before marking the auth flow as stable.
