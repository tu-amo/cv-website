-- ============================================================
-- SCHEMA SNAPSHOT — The Living Cookbook
-- Last Updated: 2026-04-06 (nutrition_flags table — user-flagged bad USDA matches for maintenance review)
-- Purpose: Canonical record of the live Supabase database state.
--   - Run the DRIFT CHECK section in the SQL Editor to compare
--     the live DB against this snapshot.
--   - Update this file after every confirmed schema change.
--
-- NOTE: Storage bucket policies (storage.objects) are separate
--   from database table policies and are listed at the bottom.
-- ============================================================


-- ── TABLES ───────────────────────────────────────────────────

-- profiles (added 2026-03-30)
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- recipes
CREATE TABLE IF NOT EXISTS recipes (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title           TEXT NOT NULL,
  description     TEXT,
  servings        INTEGER,
  prep_time_minutes INTEGER,
  cook_time_minutes INTEGER,
  difficulty      TEXT,
  tags            TEXT[],
  images          TEXT[],
  image           TEXT,
  is_public       BOOLEAN DEFAULT false,       -- confirmed live 2026-03-30
  updated_by      UUID,                         -- added 2026-03-30; FK below
  ai_images_used  INTEGER DEFAULT 0,
  source_id       UUID,
  page_number     TEXT,
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  group_id        UUID REFERENCES groups(id) ON DELETE SET NULL,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- FK: recipes.updated_by → profiles.id (explicit name for PostgREST join discovery)
ALTER TABLE recipes ADD CONSTRAINT recipes_updated_by_fkey
  FOREIGN KEY (updated_by) REFERENCES profiles(id);

-- sources
CREATE TABLE IF NOT EXISTS sources (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id   UUID REFERENCES recipes(id) ON DELETE CASCADE,
  type        TEXT,
  name        TEXT,
  url         TEXT,
  author      TEXT,
  page        TEXT
);

-- ingredients
CREATE TABLE IF NOT EXISTS ingredients (
  id    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name  TEXT UNIQUE NOT NULL
);

-- recipe_ingredients
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id     UUID REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id),
  display_name  TEXT,
  quantity      NUMERIC,
  unit          TEXT,
  preparation   TEXT,
  section       TEXT,
  sort_order    INTEGER DEFAULT 0
);

-- instruction_steps
CREATE TABLE IF NOT EXISTS instruction_steps (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id        UUID REFERENCES recipes(id) ON DELETE CASCADE,
  step_number      INTEGER,
  instruction_text TEXT,
  duration_minutes INTEGER
);

-- recipe_notes
CREATE TABLE IF NOT EXISTS recipe_notes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id  UUID REFERENCES recipes(id) ON DELETE CASCADE,
  content    TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- adaptation_notes
CREATE TABLE IF NOT EXISTS adaptation_notes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id  UUID REFERENCES recipes(id) ON DELETE CASCADE,
  content    TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- groups
CREATE TABLE IF NOT EXISTS groups (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  description TEXT,
  owner_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invite_code TEXT UNIQUE DEFAULT substring(md5(random()::text) from 0 for 9),
  group_type  TEXT NOT NULL DEFAULT 'household' CHECK (group_type IN ('household', 'pro_kitchen')),
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- production_plans (Pro Kitchen)
CREATE TABLE IF NOT EXISTS production_plans (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id        BIGINT      REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  group_id         UUID        REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  planned_servings INTEGER     NOT NULL CHECK (planned_servings > 0),
  planned_date     DATE,
  assigned_to      TEXT,
  notes            TEXT,
  status           TEXT        NOT NULL DEFAULT 'draft'
                               CHECK (status IN ('draft', 'confirmed', 'completed', 'cancelled')),
  created_by       UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- group_members
CREATE TABLE IF NOT EXISTS group_members (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id   UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role       TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
  UNIQUE(group_id, user_id)
);

-- shopping_list
CREATE TABLE IF NOT EXISTS shopping_list (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_name   TEXT NOT NULL,
  quantity    TEXT,
  unit        TEXT,
  category    TEXT,
  is_checked  BOOLEAN DEFAULT false,
  recipe_id   UUID REFERENCES recipes(id) ON DELETE SET NULL,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  group_id    UUID REFERENCES groups(id) ON DELETE CASCADE,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);


-- ── SECURITY DEFINER FUNCTIONS ────────────────────────────────

-- Breaks RLS recursion for group membership lookups
CREATE OR REPLACE FUNCTION get_my_group_ids()
RETURNS SETOF UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT group_id FROM group_members WHERE user_id = auth.uid();
$$;


-- ── RLS POLICIES (CURRENT CANONICAL STATE) ───────────────────

-- recipes
-- SELECT: own | group member | public (anonymous)
CREATE POLICY "recipes_select" ON recipes
  FOR SELECT USING (
    user_id = auth.uid()
    OR group_id IN (SELECT get_my_group_ids())
    OR is_public = true
  );
-- PUBLIC (anonymous access for is_public recipes) — added 2026-03-30
CREATE POLICY "Anyone can see public recipes" ON recipes
  FOR SELECT USING (is_public = true);
-- ALL (write): owner only
CREATE POLICY "recipes_write" ON recipes
  FOR ALL USING (user_id = auth.uid());

-- recipe_ingredients (full CRUD — authenticated users only)
CREATE POLICY "ri_read"   ON recipe_ingredients FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "ri_insert" ON recipe_ingredients FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "ri_update" ON recipe_ingredients FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "ri_delete" ON recipe_ingredients FOR DELETE USING (auth.uid() IS NOT NULL);

-- instruction_steps (full CRUD — authenticated users only)
CREATE POLICY "is_read"   ON instruction_steps FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "is_insert" ON instruction_steps FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "is_update" ON instruction_steps FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "is_delete" ON instruction_steps FOR DELETE USING (auth.uid() IS NOT NULL);

-- recipe_notes (full CRUD — authenticated users only)
CREATE POLICY "rn_read"   ON recipe_notes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "rn_insert" ON recipe_notes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "rn_update" ON recipe_notes FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "rn_delete" ON recipe_notes FOR DELETE USING (auth.uid() IS NOT NULL);

-- ingredients (read-only for authenticated users; inserts done via service logic)
CREATE POLICY "auth_read_ingredients" ON ingredients
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- sources (full CRUD — authenticated users only)
CREATE POLICY "src_read"   ON sources FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "src_insert" ON sources FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "src_update" ON sources FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "src_delete" ON sources FOR DELETE USING (auth.uid() IS NOT NULL);

-- adaptation_notes
CREATE POLICY "auth_read_adaptation_notes" ON adaptation_notes
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- groups
CREATE POLICY "groups_select" ON groups
  FOR SELECT USING (
    owner_id = auth.uid() OR id IN (SELECT get_my_group_ids())
  );
CREATE POLICY "groups_insert" ON groups
  FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "groups_update" ON groups
  FOR UPDATE USING (owner_id = auth.uid());

-- group_members
CREATE POLICY "gm_select_own" ON group_members
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "gm_select_teammates" ON group_members
  FOR SELECT USING (group_id IN (SELECT get_my_group_ids()));
CREATE POLICY "gm_insert" ON group_members
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "gm_delete_own" ON group_members
  FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "gm_delete_as_owner" ON group_members
  FOR DELETE USING (
    group_id IN (SELECT id FROM groups WHERE owner_id = auth.uid())
  );

-- shopping_list (rebuilt 2026-03-30 — removed legacy open-access policy)
CREATE POLICY "shopping_select" ON shopping_list
  FOR SELECT USING (
    user_id = auth.uid()
    OR group_id IN (SELECT get_my_group_ids())
  );
CREATE POLICY "shopping_insert" ON shopping_list
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "shopping_update" ON shopping_list
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "shopping_delete" ON shopping_list
  FOR DELETE USING (user_id = auth.uid());

-- profiles (added 2026-03-30)
CREATE POLICY "profiles_read"   ON profiles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (id = auth.uid());


-- ── STORAGE BUCKET POLICIES (storage.objects) ─────────────────
-- These are separate from database RLS policies.
-- Check/manage at: Supabase Dashboard → Storage → recipe-images → Policies
-- Or audit with: SELECT policyname, cmd FROM pg_policies WHERE schemaname = 'storage';

-- recipe-images bucket: authenticated uploads
CREATE POLICY "auth_upload_recipe_images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'recipe-images' AND auth.uid() IS NOT NULL
  );

-- recipe-images bucket: authenticated reads (required for signed URLs)
CREATE POLICY "auth_read_recipe_images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'recipe-images' AND auth.uid() IS NOT NULL
  );

-- recipe-images bucket: anonymous reads for public recipe images
-- Allows unauthenticated users to createSignedUrl() for gallery + public recipe pages.
-- Upload/delete remain authenticated-only (policies above).
-- Added: 2026-04-04
CREATE POLICY "anon_read_recipe_images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'recipe-images'
  );

-- recipe-images bucket: authenticated deletes
CREATE POLICY "auth_delete_recipe_images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'recipe-images' AND auth.uid() IS NOT NULL
  );


-- ── DRIFT CHECK QUERY ─────────────────────────────────────────
-- Run this in the Supabase SQL Editor to audit live state vs. this snapshot.
-- Any table with rls_on=true and policy_count=0 is a silent blackout.

/*
SELECT
  t.tablename,
  t.rowsecurity                         AS rls_on,
  COUNT(p.policyname)                   AS policy_count,
  STRING_AGG(p.policyname, ', ')        AS live_policies
FROM pg_tables t
LEFT JOIN pg_policies p
  ON p.tablename = t.tablename AND p.schemaname = 'public'
WHERE t.schemaname = 'public'
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.tablename;

-- P0 DATA ISOLATION CHECK — any result here is a critical bug:
SELECT tablename, policyname
FROM pg_policies
WHERE qual = 'true' AND schemaname = 'public';
*/

-- nutrition_cache (added 2026-04-03)
-- L2 persistent cache for USDA FoodData Central ingredient lookups.
CREATE TABLE IF NOT EXISTS nutrition_cache (
    ingredient_name  TEXT        PRIMARY KEY,
    usda_fdc_id      INTEGER,
    usda_name        TEXT,
    usda_datatype    TEXT,
    kcal_100g        NUMERIC(8,2),
    protein_100g     NUMERIC(8,2),
    fat_100g         NUMERIC(8,2),
    carbs_100g       NUMERIC(8,2),
    fiber_100g       NUMERIC(8,2),
    confidence       TEXT,
    fetched_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS nutrition_cache_fetched_at_idx ON nutrition_cache (fetched_at);
ALTER TABLE nutrition_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nutrition_cache_public_read" ON nutrition_cache FOR SELECT USING (true);

-- nutrition_flags (added 2026-04-06)
-- Tracks bad USDA matches flagged by the user from the NutritionPanel UI.
-- Review: SELECT * FROM nutrition_flags WHERE status = 'open' ORDER BY flagged_at;
-- Resolve: UPDATE nutrition_flags SET status = 'resolved', resolution_note = '...' WHERE ingredient_name = '...';
CREATE TABLE IF NOT EXISTS nutrition_flags (
    id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    ingredient_name  text        NOT NULL,
    usda_name        text,
    usda_fdc_id      integer,
    kcal_100g        numeric,
    confidence       text,
    recipe_id        bigint      REFERENCES recipes(id) ON DELETE SET NULL,
    flagged_by       uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
    flagged_at       timestamptz NOT NULL DEFAULT now(),
    status           text        NOT NULL DEFAULT 'open'
                                 CHECK (status IN ('open', 'resolved', 'wont_fix')),
    resolution_note  text
);
CREATE INDEX IF NOT EXISTS nutrition_flags_status_idx    ON nutrition_flags (status, flagged_at);
CREATE INDEX IF NOT EXISTS nutrition_flags_ingredient_idx ON nutrition_flags (ingredient_name);
ALTER TABLE nutrition_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can flag nutrition matches"
    ON nutrition_flags FOR INSERT TO authenticated
    WITH CHECK (flagged_by = auth.uid());
CREATE POLICY "Users can view their own flags"
    ON nutrition_flags FOR SELECT TO authenticated
    USING (flagged_by = auth.uid());
CREATE POLICY "Users can update their own flags"
    ON nutrition_flags FOR UPDATE TO authenticated
    USING (flagged_by = auth.uid());

