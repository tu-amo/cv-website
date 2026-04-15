---
name: recipe-seed-data
description: >
  How to seed test recipe data directly into the Living Cookbook Supabase staging database.
  Use this skill when you need to add recipes for testing without going through the app UI.
  Covers the correct column names, data types, and the ingredient_id=null pattern.
---

# Recipe Seed Data Skill

## When to Use
- You need test recipes in staging for feature testing (e.g. Pro Kitchen stock check)
- The app UI is behind a login wall (browser subagent can't log in)
- You need bulk recipes quickly

---

## CRITICAL: Verified Schema Types

The `supabase/schema_snapshot.sql` has historically had incorrect types. **Always trust these verified facts over the snapshot:**

| Table | Column | Actual Type | Notes |
|---|---|---|---|
| `recipes` | `id` | `BIGINT` (identity) | NOT uuid |
| `recipes` | `user_id` | `UUID` | FK → auth.users |
| `recipe_ingredients` | `recipe_id` | `BIGINT` nullable | FK → recipes.id |
| `recipe_ingredients` | `ingredient_id` | `BIGINT` nullable | **Leave NULL — see pattern below** |
| `recipe_ingredients` | `display_name` | `TEXT` | Use this instead of ingredient_id |
| `instruction_steps` | `recipe_id` | `BIGINT` nullable | FK → recipes.id |
| `instruction_steps` | `instruction_text` | `TEXT` | NOT "instruction" |
| `ingredients` | `id` | `BIGINT` | NOT uuid |
| `ingredients` | `name` | `TEXT UNIQUE` | Constraint: `ingredients_name_key` |

If in doubt, verify with:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'recipe_ingredients'
ORDER BY ordinal_position;
```

---

## The Correct Seed Pattern

**Skip the ingredients catalog.** `recipe_ingredients.ingredient_id` is nullable. The app resolves display names at runtime. Using ingredient_id requires a JOIN and risks type-mismatch errors.

```sql
DO $$
DECLARE
  v_uid uuid := '<staging-user-id>';  -- get from: SELECT id FROM auth.users;
  r1 bigint;                          -- BIGINT to match recipes.id
BEGIN

  INSERT INTO recipes (title, servings, prep_time_minutes, cook_time_minutes, user_id, is_public)
  VALUES ('Recipe Title', 4, 15, 30, v_uid, false)
  RETURNING id INTO r1;

  -- ingredient_id omitted (defaults to NULL) — use display_name only
  INSERT INTO recipe_ingredients (recipe_id, quantity, unit, sort_order, display_name) VALUES
  (r1, 400, 'g',    1, 'Main Ingredient'),
  (r1, 2,   'tbsp', 2, 'Second Ingredient'),
  (r1, 1,   'tsp',  3, 'Third Ingredient');

  -- Use instruction_text (NOT "instruction")
  INSERT INTO instruction_steps (recipe_id, step_number, instruction_text) VALUES
  (r1, 1, 'First step.'),
  (r1, 2, 'Second step.'),
  (r1, 3, 'Third step.');

END $$;
```

---

## Finding Your Staging User ID

Run in the **Staging SQL Editor** (hbgxotjjpapdqlqrofqz):
```sql
SELECT id, email FROM auth.users ORDER BY created_at;
```

**Known staging user:** `d03274cc-fd2e-4415-84fe-8abe8ddb2d6a`

---

## Reusable Template

A ready-to-copy template lives at:
`supabase/seeds/recipe_seed_template.sql`

---

## Verifying the Seed Worked

After the DO block, run a separate query:
```sql
SELECT id, title, user_id, created_at 
FROM recipes 
ORDER BY created_at DESC 
LIMIT 5;
```

If your new recipes don't appear, the DO block rolled back silently. Debug by running individual INSERT statements outside the block to find the failing one.

---

## Common Mistakes

| ❌ Wrong | ✅ Correct |
|---|---|
| `owner_id` in recipes INSERT | `user_id` |
| Declare recipe vars as `uuid` | Declare as `bigint` |
| `instruction` column | `instruction_text` column |
| Join on `ingredients.id` for ingredient_id | Skip ingredient_id entirely (NULL) |
| Run the seed + verify in one block | Run seed block first, then separate SELECT |
