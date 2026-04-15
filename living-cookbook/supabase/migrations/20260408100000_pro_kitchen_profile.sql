-- ── PKP1 + H12/H13: Pro Kitchen Profile & Member Management ──────────────────
-- Date: 2026-04-08
--
-- 1. Adds company profile columns to groups table (PKP1)
-- 2. No schema changes needed for H12/H13 — member removal uses existing
--    group_members table; member listing queries group_members + profiles.

-- ── Pro Kitchen profile columns ───────────────────────────────────────────────
ALTER TABLE groups
    ADD COLUMN IF NOT EXISTS company_name    TEXT,
    ADD COLUMN IF NOT EXISTS company_address TEXT,
    ADD COLUMN IF NOT EXISTS contact_email   TEXT;

-- Note: company_name defaults to NULL (falls back to groups.name in UI)
-- contact_email is the email of the person placing orders (not the supplier)
-- company_address is used in PDF order headers
