-- Migration: Add banner_url to projects table + create project_banners storage bucket
-- Date: 2026-03-03

-- 1. Add banner_url column to projects
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS banner_url text;

-- 2. Create the project_banners storage bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project_banners',
  'project_banners',
  true,
  10485760, -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage RLS: allow authenticated users to upload
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND policyname = 'project_banners_insert'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY project_banners_insert
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'project_banners')
    $policy$;
  END IF;
END $$;

-- 4. Storage RLS: allow public read
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND policyname = 'project_banners_select'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY project_banners_select
        ON storage.objects FOR SELECT
        TO public
        USING (bucket_id = 'project_banners')
    $policy$;
  END IF;
END $$;

-- 5. Storage RLS: allow authenticated users to update (overwrite)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND policyname = 'project_banners_update'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY project_banners_update
        ON storage.objects FOR UPDATE
        TO authenticated
        USING (bucket_id = 'project_banners')
    $policy$;
  END IF;
END $$;
