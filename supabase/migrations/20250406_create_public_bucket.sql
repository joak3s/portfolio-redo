-- Create 'public' storage bucket if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'public'
  ) THEN
    INSERT INTO storage.buckets (id, name, public, avif_autodetection)
    VALUES ('public', 'public', true, false);
  ELSE
    UPDATE storage.buckets
    SET public = true
    WHERE id = 'public';
  END IF;
END
$$;

-- Set file size limit and allowed mime types
UPDATE storage.buckets
SET 
  file_size_limit = 5242880, -- 5MB file size limit
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']::text[]
WHERE id = 'public';

-- Add RLS policy to allow unauthenticated users to read from the public bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Public Access'
  ) THEN
    EXECUTE 'CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = ''public'')';
  END IF;
END
$$;

-- Add RLS policy to allow authenticated users to upload to the public bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Upload Access'
  ) THEN
    EXECUTE 'CREATE POLICY "Upload Access" ON storage.objects FOR INSERT WITH CHECK (bucket_id = ''public'' AND auth.role() = ''authenticated'')';
  END IF;
END
$$;

-- Add RLS policy to allow authenticated users to update their own objects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Owner Update Access'
  ) THEN
    EXECUTE 'CREATE POLICY "Owner Update Access" ON storage.objects FOR UPDATE USING (bucket_id = ''public'' AND auth.uid() = owner AND auth.role() = ''authenticated'')';
  END IF;
END
$$;

-- Add RLS policy to allow authenticated users to delete their own objects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Owner Delete Access'
  ) THEN
    EXECUTE 'CREATE POLICY "Owner Delete Access" ON storage.objects FOR DELETE USING (bucket_id = ''public'' AND auth.uid() = owner AND auth.role() = ''authenticated'')';
  END IF;
END
$$; 