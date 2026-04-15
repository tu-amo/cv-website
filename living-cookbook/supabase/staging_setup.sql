-- ================================================================
-- STAGING SETUP — The Living Cookbook (living-cookbook-dev)
-- ================================================================
-- Run this in the Supabase SQL Editor on a FRESH project.
-- Tables are in strict dependency order (no FK forward-references).
--
-- Fixes vs. schema_snapshot.sql:
--   1. groups created BEFORE recipes (snapshot had them after)
--   2. recipes.id is BIGINT IDENTITY (snapshot wrongly documented as UUID)
--   3. All FK columns referencing recipes(id) are BIGINT
--   4. nutrition_cache and nutrition_flags are in the main table block
--   5. RLS ENABLE + policies separated for clarity
--
-- After running this SQL:
--   → Create the `recipe-images` storage bucket manually in the dashboard
--   → Set Auth URL Configuration: Site URL = http://localhost:3000
-- ================================================================

-- ── Extensions ───────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. groups (must be before recipes) ──────────────────────────
CREATE TABLE IF NOT EXISTS groups (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  description TEXT,
  owner_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invite_code TEXT UNIQUE DEFAULT substring(md5(random()::text) from 0 for 9),
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- ── 2. profiles ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- ── 3. recipes ───────────────────────────────────────────────────
-- NOTE: id is BIGINT (matches production — Supabase table-editor default).
--       The schema_snapshot.sql incorrectly documents this as UUID.
CREATE TABLE IF NOT EXISTS recipes (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title             TEXT NOT NULL,
  description       TEXT,
  servings          INTEGER,
  prep_time_minutes INTEGER,
  cook_time_minutes INTEGER,
  difficulty        TEXT,
  tags              TEXT[],
  images            TEXT[],
  image             TEXT,
  is_public         BOOLEAN DEFAULT false,
  updated_by        UUID REFERENCES profiles(id),
  ai_images_used    INTEGER DEFAULT 0,
  source_id         UUID,
  page_number       TEXT,
  user_id           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  group_id          UUID REFERENCES groups(id) ON DELETE SET NULL,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- ── 4. sources ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sources (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id BIGINT REFERENCES recipes(id) ON DELETE CASCADE,
  type      TEXT,
  name      TEXT,
  url       TEXT,
  author    TEXT,
  page      TEXT
);

-- ── 5. ingredients ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ingredients (
  id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL
);

-- ── 6. recipe_ingredients ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id     BIGINT REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id),
  display_name  TEXT,
  quantity      NUMERIC,
  unit          TEXT,
  preparation   TEXT,
  section       TEXT,
  sort_order    INTEGER DEFAULT 0
);

-- ── 7. instruction_steps ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS instruction_steps (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id        BIGINT REFERENCES recipes(id) ON DELETE CASCADE,
  step_number      INTEGER,
  instruction_text TEXT,
  duration_minutes INTEGER
);

-- ── 8. recipe_notes ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recipe_notes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id  BIGINT REFERENCES recipes(id) ON DELETE CASCADE,
  content    TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- ── 9. adaptation_notes ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS adaptation_notes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id  BIGINT REFERENCES recipes(id) ON DELETE CASCADE,
  content    TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- ── 10. group_members ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS group_members (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id   UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role       TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
  UNIQUE(group_id, user_id)
);

-- ── 11. shopping_list ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shopping_list (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_name  TEXT NOT NULL,
  quantity   TEXT,
  unit       TEXT,
  category   TEXT,
  is_checked BOOLEAN DEFAULT false,
  recipe_id  BIGINT REFERENCES recipes(id) ON DELETE SET NULL,
  user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  group_id   UUID REFERENCES groups(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- ── 12. nutrition_cache ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nutrition_cache (
  ingredient_name TEXT        PRIMARY KEY,
  usda_fdc_id     INTEGER,
  usda_name       TEXT,
  usda_datatype   TEXT,
  kcal_100g       NUMERIC(8,2),
  protein_100g    NUMERIC(8,2),
  fat_100g        NUMERIC(8,2),
  carbs_100g      NUMERIC(8,2),
  fiber_100g      NUMERIC(8,2),
  confidence      TEXT,
  fetched_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS nutrition_cache_fetched_at_idx ON nutrition_cache (fetched_at);

-- ── 13. nutrition_flags ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nutrition_flags (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_name TEXT        NOT NULL,
  usda_name       TEXT,
  usda_fdc_id     INTEGER,
  kcal_100g       NUMERIC,
  confidence      TEXT,
  recipe_id       BIGINT      REFERENCES recipes(id) ON DELETE SET NULL,
  flagged_by      UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  flagged_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  status          TEXT        NOT NULL DEFAULT 'open'
                              CHECK (status IN ('open', 'resolved', 'wont_fix')),
  resolution_note TEXT
);
CREATE INDEX IF NOT EXISTS nutrition_flags_status_idx     ON nutrition_flags (status, flagged_at);
CREATE INDEX IF NOT EXISTS nutrition_flags_ingredient_idx ON nutrition_flags (ingredient_name);


-- ── Security-definer helper (breaks RLS recursion) ───────────────
CREATE OR REPLACE FUNCTION get_my_group_ids()
RETURNS SETOF UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT group_id FROM group_members WHERE user_id = auth.uid();
$$;


-- ── Enable RLS on all tables ──────────────────────────────────────
ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources           ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients       ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE instruction_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_notes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE adaptation_notes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups            ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list     ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_cache   ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_flags   ENABLE ROW LEVEL SECURITY;


-- ── RLS Policies ─────────────────────────────────────────────────

-- profiles
CREATE POLICY "profiles_read"   ON profiles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (id = auth.uid());

-- recipes
CREATE POLICY "recipes_select" ON recipes FOR SELECT USING (
  user_id = auth.uid()
  OR group_id IN (SELECT get_my_group_ids())
  OR is_public = true
);
CREATE POLICY "Anyone can see public recipes" ON recipes FOR SELECT USING (is_public = true);
CREATE POLICY "recipes_write" ON recipes FOR ALL USING (user_id = auth.uid());

-- sources
CREATE POLICY "src_read"   ON sources FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "src_insert" ON sources FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "src_update" ON sources FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "src_delete" ON sources FOR DELETE USING (auth.uid() IS NOT NULL);

-- ingredients
CREATE POLICY "auth_read_ingredients" ON ingredients FOR SELECT USING (auth.uid() IS NOT NULL);

-- recipe_ingredients
CREATE POLICY "ri_read"   ON recipe_ingredients FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "ri_insert" ON recipe_ingredients FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "ri_update" ON recipe_ingredients FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "ri_delete" ON recipe_ingredients FOR DELETE USING (auth.uid() IS NOT NULL);

-- instruction_steps
CREATE POLICY "is_read"   ON instruction_steps FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "is_insert" ON instruction_steps FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "is_update" ON instruction_steps FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "is_delete" ON instruction_steps FOR DELETE USING (auth.uid() IS NOT NULL);

-- recipe_notes
CREATE POLICY "rn_read"   ON recipe_notes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "rn_insert" ON recipe_notes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "rn_update" ON recipe_notes FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "rn_delete" ON recipe_notes FOR DELETE USING (auth.uid() IS NOT NULL);

-- adaptation_notes
CREATE POLICY "auth_read_adaptation_notes" ON adaptation_notes FOR SELECT USING (auth.uid() IS NOT NULL);

-- groups
CREATE POLICY "groups_select" ON groups FOR SELECT USING (
  owner_id = auth.uid() OR id IN (SELECT get_my_group_ids())
);
CREATE POLICY "groups_insert" ON groups FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "groups_update" ON groups FOR UPDATE USING (owner_id = auth.uid());

-- group_members
CREATE POLICY "gm_select_own"       ON group_members FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "gm_select_teammates" ON group_members FOR SELECT USING (group_id IN (SELECT get_my_group_ids()));
CREATE POLICY "gm_insert"           ON group_members FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "gm_delete_own"       ON group_members FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "gm_delete_as_owner"  ON group_members FOR DELETE USING (
  group_id IN (SELECT id FROM groups WHERE owner_id = auth.uid())
);

-- shopping_list
CREATE POLICY "shopping_select" ON shopping_list FOR SELECT USING (
  user_id = auth.uid() OR group_id IN (SELECT get_my_group_ids())
);
CREATE POLICY "shopping_insert" ON shopping_list FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "shopping_update" ON shopping_list FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "shopping_delete" ON shopping_list FOR DELETE USING (user_id = auth.uid());

-- nutrition_cache (public read — anon users need kcal data for public recipe pages)
CREATE POLICY "nutrition_cache_public_read" ON nutrition_cache FOR SELECT USING (true);

-- nutrition_flags
CREATE POLICY "Authenticated users can flag nutrition matches"
  ON nutrition_flags FOR INSERT TO authenticated
  WITH CHECK (flagged_by = auth.uid());
CREATE POLICY "Users can view their own flags"
  ON nutrition_flags FOR SELECT TO authenticated
  USING (flagged_by = auth.uid());
CREATE POLICY "Users can update their own flags"
  ON nutrition_flags FOR UPDATE TO authenticated
  USING (flagged_by = auth.uid());


-- ================================================================
-- AFTER RUNNING THIS SQL — do these manually in the dashboard:
--
-- 1. Storage → Create bucket named: recipe-images
--      Public bucket: NO
--      Then add these storage policies:
--        INSERT: bucket_id = 'recipe-images' AND auth.uid() IS NOT NULL
--        SELECT: bucket_id = 'recipe-images'  (anon OK for public recipe images)
--        DELETE: bucket_id = 'recipe-images' AND auth.uid() IS NOT NULL
--
-- 2. Authentication → URL Configuration:
--        Site URL:       http://localhost:3000
--        Redirect URLs:  http://localhost:3000/auth/callback
-- ================================================================
