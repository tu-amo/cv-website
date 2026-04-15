/**
 * One-off admin script: set a temporary password for a stuck user.
 * Bypasses email entirely — no rate limits.
 *
 * Usage:
 *   node scripts/set-user-password.js <user-uuid> <new-password>
 *
 * Example:
 *   node scripts/set-user-password.js abc123-... TempPass999!
 *
 * Delete this file after use.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env.local manually (we're running outside Next.js)
const envPath = resolve(process.cwd(), '.env.local');
const env = Object.fromEntries(
    readFileSync(envPath, 'utf8')
        .split('\n')
        .filter(line => line && !line.startsWith('#') && line.includes('='))
        .map(line => {
            const idx = line.indexOf('=');
            return [line.slice(0, idx).trim(), line.slice(idx + 1).trim().replace(/^["']|["']$/g, '')];
        })
);

const SUPABASE_URL        = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY    = env.SUPABASE_SERVICE_ROLE_KEY;

const userId      = process.argv[2];
const newPassword = process.argv[3];

if (!userId || !newPassword) {
    console.error('Usage: node scripts/set-user-password.js <user-uuid> <new-password>');
    process.exit(1);
}

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
}

const url = `${SUPABASE_URL}/auth/v1/admin/users/${userId}`;
const response = await fetch(url, {
    method: 'PATCH',
    headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({ password: newPassword }),
});

const result = await response.json();

if (!response.ok) {
    console.error('❌ Failed:', result);
    process.exit(1);
}

console.log(`✅ Password updated for user: ${result.email}`);
console.log('→ Tell the user to log in with this temporary password, then immediately change it at /login/reset-password');
console.log('→ Delete this script file after use: rm scripts/set-user-password.js');
