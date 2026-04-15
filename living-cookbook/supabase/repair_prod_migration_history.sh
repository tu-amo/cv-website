#!/bin/bash
# Run this script from living-cookbook/ to mark all historical migrations
# as already applied on production, without re-running them.
# This fixes the empty supabase_migrations.schema_migrations table on prod.

# Step 1: Link to production
supabase link --project-ref hiuhjnodzodcgwltweoc

# Step 2: Mark every migration as already applied
supabase migration repair --status applied 20260317154720
supabase migration repair --status applied 20260317182500
supabase migration repair --status applied 20260325103000
supabase migration repair --status applied 20260330120000
supabase migration repair --status applied 20260330140000
supabase migration repair --status applied 20260403232959
supabase migration repair --status applied 20260404220000
supabase migration repair --status applied 20260404221500
supabase migration repair --status applied 20260406193000
supabase migration repair --status applied 20260406200000
supabase migration repair --status applied 20260407100000
supabase migration repair --status applied 20260407110000
supabase migration repair --status applied 20260407120000
supabase migration repair --status applied 20260408100000
supabase migration repair --status applied 20260408110000
supabase migration repair --status applied 20260408120000
supabase migration repair --status applied 20260414210000
supabase migration repair --status applied 20260415140000

# Step 3: Verify — all 18 should show "applied"
supabase migration list
