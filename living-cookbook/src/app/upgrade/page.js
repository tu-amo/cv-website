'use client'

import { useState, useTransition, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { joinWaitlist } from './actions'

// ── Feature cards ─────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: '📸',
    title: '30 Recipe Scans / Month',
    body: 'Import from any cookbook, magazine, or handwritten card with AI-powered OCR. 6× more than the free plan.',
  },
  {
    icon: '✨',
    title: 'AI Styling Briefs',
    body: '5 AI-generated food styling briefs per month — plating guides, lighting tips, and mood board suggestions for your recipes.',
  },
  {
    icon: '📚',
    title: 'Unlimited Recipes',
    body: 'No 15-recipe cap. Build a full digital cookbook with every dish you\'ve ever made or loved.',
  },
  {
    icon: '🏠',
    title: 'Up to 3 Households',
    body: 'Run separate kitchens for home, the weekend house, or your extended family — each with its own shared recipes and shopping list.',
  },
  {
    icon: '📊',
    title: 'Advanced Nutrition Tracking',
    body: 'Full macro breakdown per serving. Track calories, protein, carbs, and fat across your whole recipe library.',
  },
  {
    icon: '🛒',
    title: 'Smart Market Lists',
    body: 'Scale any recipe and push straight to your household shopping list. Consolidated by aisle. No duplicates.',
  },
]

// ── Tier pricing card ─────────────────────────────────────────────────────────
const TIER = {
  name:  'Kitchen+',
  price: '€5.99',
  note:  'per month',
}

// ── Spots remaining (shown in urgency banner) ─────────────────────────────────
const TOTAL_SPOTS = 50

export default function UpgradePage() {
  const [email, setEmail]           = useState('')
  const [userId, setUserId]         = useState('')
  const [status, setStatus]         = useState('idle') // idle | success | duplicate | error
  const [errorMsg, setErrorMsg]     = useState('')
  const [spotsLeft, setSpotsLeft]   = useState(null)
  const [isPending, startTransition] = useTransition()

  // Pre-fill email from session if user is logged in
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setEmail(user.email)
      if (user?.id)    setUserId(user.id)
    })

    // Fetch current waitlist count to derive spots remaining
    supabase
      .from('waitlist')
      .select('id', { count: 'exact', head: true })
      .then(({ count }) => {
        const left = Math.max(0, TOTAL_SPOTS - (count || 0))
        setSpotsLeft(left)
      })
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!email) return

    startTransition(async () => {
      const fd = new FormData()
      fd.append('email',   email)
      fd.append('user_id', userId)

      const result = await joinWaitlist(fd)

      if (result.success)      { setStatus('success')   }
      else if (result.alreadyJoined) { setStatus('duplicate') }
      else                     { setStatus('error'); setErrorMsg(result.error || 'Something went wrong.') }
    })
  }

  return (
    <div className="pp-page-card">

      {/* ── Locked badge ───────────────────────────────────────────────────── */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)',
        borderRadius: 24, padding: '6px 16px', marginBottom: 28,
        fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em',
        color: 'var(--color-accent-amber)',
      }}>
        <span>🔒</span> UPGRADES CURRENTLY LOCKED
      </div>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <h1 style={{
        fontFamily: 'var(--pp-font-brand)',
        fontSize: 'clamp(1.8rem, 5vw, 2.8rem)',
        fontWeight: 800, lineHeight: 1.15,
        color: 'var(--color-on-surface)',
        marginBottom: 16,
      }}>
        We're building something<br />
        <span style={{ color: 'var(--color-accent-amber)' }}>worth waiting for.</span>
      </h1>

      <p style={{
        fontSize: '1.05rem', color: 'var(--color-text-muted)',
        lineHeight: 1.65, maxWidth: 560, marginBottom: 36,
      }}>
        Kitchen+ is in active development. We're not ready to charge anyone yet —
        but we <em>are</em> building the features below, and we want our early community
        to benefit most.
      </p>

      {/* ── Urgency banner ─────────────────────────────────────────────────── */}
      {spotsLeft !== null && spotsLeft > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))',
          border: '1.5px solid rgba(245,158,11,0.3)',
          borderRadius: 16, padding: '18px 24px',
          marginBottom: 36,
          display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
        }}>
          <div style={{ fontSize: '2rem' }}>🎁</div>
          <div>
            <div style={{
              fontFamily: 'var(--pp-font-brand)', fontWeight: 700,
              color: 'var(--color-accent-amber)', fontSize: '1.05rem', marginBottom: 4,
            }}>
              First {TOTAL_SPOTS} signups get 3 months of Kitchen+ free.
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              {spotsLeft} of {TOTAL_SPOTS} spots remaining. No credit card required. Ever, if you don't want to upgrade.
            </div>
          </div>
        </div>
      )}

      {spotsLeft === 0 && (
        <div style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-divider)',
          borderRadius: 16, padding: '18px 24px', marginBottom: 36,
          fontSize: '0.9rem', color: 'var(--color-text-muted)',
        }}>
          All 50 early-access spots have been claimed. Join the waitlist to be notified when Kitchen+ launches — you'll get our best launch price.
        </div>
      )}

      {/* ── Waitlist form ──────────────────────────────────────────────────── */}
      {status === 'idle' || status === 'error' ? (
        <form onSubmit={handleSubmit} style={{
          display: 'flex', gap: 12, flexWrap: 'wrap',
          marginBottom: 48,
        }}>
          <input
            id="waitlist-email"
            type="email"
            required
            className="form-control"
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ flex: '1 1 260px' }}
          />
          <button
            type="submit"
            className="btn-add"
            disabled={isPending || !email}
            style={{ whiteSpace: 'nowrap', minWidth: 180 }}
          >
            {isPending ? 'Saving your spot…' : spotsLeft === 0 ? 'Join the waitlist' : 'Claim my free months →'}
          </button>
          {status === 'error' && (
            <p style={{ width: '100%', margin: 0, fontSize: '0.85rem', color: '#ff6b6b' }}>{errorMsg}</p>
          )}
        </form>
      ) : status === 'success' ? (
        <div style={{
          background: 'linear-gradient(135deg, rgba(0,200,150,0.12), rgba(0,200,150,0.04))',
          border: '1.5px solid rgba(0,200,150,0.3)',
          borderRadius: 16, padding: '24px 28px', marginBottom: 48,
        }}>
          <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>🎉</div>
          <div style={{
            fontFamily: 'var(--pp-font-brand)', fontWeight: 700,
            color: 'rgba(0,200,150,0.9)', fontSize: '1.1rem', marginBottom: 6,
          }}>You're on the list!</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            We'll email you at <strong>{email}</strong> the moment Kitchen+ is ready.
            {spotsLeft !== null && spotsLeft > 0 && ' Your 3 free months are reserved.'}
          </div>
        </div>
      ) : (
        <div style={{
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: 16, padding: '20px 24px', marginBottom: 48,
          fontSize: '0.9rem', color: 'var(--color-accent-amber)',
        }}>
          ✓ You're already on the waitlist — we'll be in touch soon.
        </div>
      )}

      {/* ── What's in Kitchen+ ────────────────────────────────────────────── */}
      <h2 className="pp-section-heading" style={{ marginBottom: 24 }}>
        What you're getting access to
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 16, marginBottom: 48,
      }}>
        {FEATURES.map((f, i) => (
          <div key={i} style={{
            background: 'var(--color-surface-alt)',
            border: '1px solid var(--color-divider)',
            borderRadius: 16, padding: '20px 22px',
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 10 }}>{f.icon}</div>
            <div style={{
              fontFamily: 'var(--pp-font-brand)', fontWeight: 700,
              color: 'var(--color-on-surface)', fontSize: '0.95rem', marginBottom: 6,
            }}>{f.title}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: 1.55 }}>
              {f.body}
            </div>
          </div>
        ))}
      </div>

      {/* ── Price anchor ─────────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--color-surface-alt)',
        border: '1.5px solid var(--color-divider)',
        borderRadius: 20, padding: '28px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 20,
        marginBottom: 16,
      }}>
        <div>
          <div style={{
            fontFamily: 'var(--pp-font-brand)', fontWeight: 800,
            fontSize: '1.4rem', color: 'var(--color-on-surface)', marginBottom: 4,
          }}>{TIER.name}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            All features above. Cancel any time.
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontFamily: 'var(--pp-font-brand)', fontWeight: 800,
            fontSize: '2rem', color: 'var(--color-accent-amber)',
          }}>{TIER.price}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{TIER.note}</div>
        </div>
      </div>

      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
        Early access members pay nothing until launch. We'll email you when payments open — with the option to claim your free months first.
      </p>

    </div>
  )
}
