-- =============================================================================
-- Migration: Add banner_url to profiles
-- Created: 2026-02-26
-- =============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS banner_url TEXT DEFAULT NULL;

COMMENT ON COLUMN public.profiles.banner_url IS
  'LinkedIn-style wide banner/cover photo URL stored in the banners storage bucket';
