-- =============================================================================
-- Migration: Admin Profiles & RLS "God Mode"
-- Created: 2026-02-26
-- Description: Creates the admin_profiles table as described in the Admin Vetting Playbook.
--              Also provisions a private storage bucket for user_identity_documents.
-- =============================================================================

-- 1. Create access_level enum
DO $$ BEGIN
  CREATE TYPE public.admin_access_level AS ENUM ('support', 'moderator', 'super_admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Create the admin_profiles table
CREATE TABLE IF NOT EXISTS public.admin_profiles (
  user_id         UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  access_level    public.admin_access_level NOT NULL DEFAULT 'support',
  department      TEXT,
  internal_notes  TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.admin_profiles IS 'Table tracking staff members. Serves as the authority layer for god-mode RLS.';

-- 3. RLS for admin_profiles (Only active admins can read/write this table, plus service role)
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_profiles: Admins can read all admins"
  ON public.admin_profiles FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.admin_profiles a WHERE a.user_id = auth.uid() AND a.is_active = true)
  );

CREATE POLICY "admin_profiles: Super admins can manage admins"
  ON public.admin_profiles FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.admin_profiles a WHERE a.user_id = auth.uid() AND a.is_active = true AND a.access_level = 'super_admin')
  );

-- 4. Set up the trigger for updated_at
CREATE OR REPLACE TRIGGER update_admin_profiles_updated_at
  BEFORE UPDATE ON public.admin_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- Storage Bucket: identity_documents (Private)
-- =============================================================================

-- Create the private bucket for KYC documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('identity_documents', 'identity_documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS for identity_documents Storage bucket (Owner read/write, Admin read)
-- Note: Supabase storage objects table is storage.objects

-- Allow users to upload their own documents
CREATE POLICY "identity_documents: Users can upload their own docs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'identity_documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to read their own documents
CREATE POLICY "identity_documents: Users can read their own docs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'identity_documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow admins to read all identity documents
CREATE POLICY "identity_documents: Admins can read all docs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'identity_documents' AND 
    EXISTS (SELECT 1 FROM public.admin_profiles a WHERE a.user_id = auth.uid() AND a.is_active = true)
  );

-- Allow users to delete their own documents
CREATE POLICY "identity_documents: Users can delete their own docs"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'identity_documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );
