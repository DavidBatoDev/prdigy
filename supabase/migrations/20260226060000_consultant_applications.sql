-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: consultant_applications
-- Created:   2026-02-26
-- Purpose:   Stores consultant applications submitted by users who want to
--            become verified consultants on the platform.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Status enum
DO $$ BEGIN
  CREATE TYPE public.application_status AS ENUM (
    'draft',
    'submitted',
    'under_review',
    'approved',
    'rejected'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Main table
CREATE TABLE IF NOT EXISTS public.consultant_applications (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status              public.application_status NOT NULL DEFAULT 'draft',

  -- Step 2 — Cover letter & experience
  cover_letter        TEXT,
  years_of_experience SMALLINT,
  primary_niche       TEXT,                -- mirrors user_specializations.category

  -- Step 3 — Links & evidence
  linkedin_url        TEXT,
  website_url         TEXT,
  why_join            TEXT,

  -- Admin fields (set on review)
  reviewed_by         UUID REFERENCES public.profiles(id),
  reviewed_at         TIMESTAMPTZ,
  rejection_reason    TEXT,

  -- Timestamps
  submitted_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT consultant_applications_user_unique UNIQUE (user_id)
);

-- 3. updated_at trigger
CREATE OR REPLACE TRIGGER update_consultant_applications_updated_at
  BEFORE UPDATE ON public.consultant_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_consultant_applications_user_id
  ON public.consultant_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_consultant_applications_status
  ON public.consultant_applications(status);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. RLS
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.consultant_applications ENABLE ROW LEVEL SECURITY;

-- Helper: is calling user an admin?
-- (Reuses is_admin() if already defined by previous migrations, otherwise creates it)
DO $$ BEGIN
  CREATE OR REPLACE FUNCTION public.is_admin()
  RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $fn$
    SELECT EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE user_id = auth.uid() AND is_active = true
    );
  $fn$;
EXCEPTION WHEN others THEN NULL;
END $$;

-- Owners can see their own application
DROP POLICY IF EXISTS "Users can view own application" ON public.consultant_applications;
CREATE POLICY "Users can view own application"
  ON public.consultant_applications FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

-- Owners can create their application (only one allowed via UNIQUE)
DROP POLICY IF EXISTS "Users can insert own application" ON public.consultant_applications;
CREATE POLICY "Users can insert own application"
  ON public.consultant_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Owners can update while in draft; Admins can update any
DROP POLICY IF EXISTS "Users can update own draft application" ON public.consultant_applications;
CREATE POLICY "Users can update own draft application"
  ON public.consultant_applications FOR UPDATE
  USING (
    (auth.uid() = user_id AND status IN ('draft', 'submitted'))
    OR public.is_admin()
  );

-- Only admins can delete
DROP POLICY IF EXISTS "Admins can delete applications" ON public.consultant_applications;
CREATE POLICY "Admins can delete applications"
  ON public.consultant_applications FOR DELETE
  USING (public.is_admin());
