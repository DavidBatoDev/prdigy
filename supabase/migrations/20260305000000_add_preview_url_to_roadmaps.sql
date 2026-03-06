    -- Add preview_url column to roadmaps table
    -- Stores an optional image URL for roadmap thumbnail previews

    ALTER TABLE public.roadmaps
    ADD COLUMN IF NOT EXISTS preview_url text;

    -- Create storage bucket for roadmap preview images
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
    'roadmap_previews',
    'roadmap_previews',
    true,
    10485760, -- 10 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
    )
    ON CONFLICT (id) DO NOTHING;

    -- Storage RLS: authenticated users can upload to their own folder
    DROP POLICY IF EXISTS "Authenticated users can upload roadmap previews" ON storage.objects;
    CREATE POLICY "Authenticated users can upload roadmap previews"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'roadmap_previews' AND (storage.foldername(name))[1] = auth.uid()::text);

    DROP POLICY IF EXISTS "Authenticated users can update their roadmap previews" ON storage.objects;
    CREATE POLICY "Authenticated users can update their roadmap previews"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'roadmap_previews' AND (storage.foldername(name))[1] = auth.uid()::text);

    DROP POLICY IF EXISTS "Authenticated users can delete their roadmap previews" ON storage.objects;
    CREATE POLICY "Authenticated users can delete their roadmap previews"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'roadmap_previews' AND (storage.foldername(name))[1] = auth.uid()::text);

    -- Public can read roadmap preview images (they're public thumbnails)
    DROP POLICY IF EXISTS "Public can view roadmap previews" ON storage.objects;
    CREATE POLICY "Public can view roadmap previews"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'roadmap_previews');
