-- ============================================================
-- Migration: Allow anonymous signed URL access to recipe-images
-- Date: 2026-04-04
-- Reason: Public recipe images must be accessible to unauthenticated
--   users on the public gallery homepage and /public/recipe/[id] pages.
--   The existing auth_read_recipe_images policy blocks anon clients
--   from calling createSignedUrl(), causing StorageApiError: Object not found.
--
-- SECURITY NOTE: This allows any unauthenticated user to generate a
--   signed URL for any path in the recipe-images bucket if they know
--   the path. Image paths are UUIDs and are not publicly enumerable,
--   so the practical exposure risk is minimal. Recipe content (not images)
--   is the sensitive data and remains protected by database RLS.
-- ============================================================

-- Allow anonymous clients to read storage objects for signed URL generation.
-- This covers the public gallery homepage and the public recipe SSR page.
CREATE POLICY "anon_read_recipe_images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'recipe-images'
  );

-- NOTE: The existing auth_upload and auth_delete policies remain unchanged.
-- Only SELECT (read / signed URL generation) is opened to anon.
