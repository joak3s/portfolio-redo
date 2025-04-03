-- Verify that storage schema exists and fix bucket setup
-- This script fixes the "Bucket not found" error

-- Check if the storage bucket exists and create it if it doesn't
DO $$
BEGIN
  -- Create the bucket if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'public'
  ) THEN
    INSERT INTO storage.buckets (id, name, public, avif_autodetection)
    VALUES ('public', 'public', true, false);
    RAISE NOTICE 'Created new public bucket';
  ELSE
    RAISE NOTICE 'Public bucket already exists';
  END IF;
  
  -- Make sure bucket is public and has proper mime types
  UPDATE storage.buckets
  SET 
    public = true,
    file_size_limit = 5242880, -- 5MB
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']::text[]
  WHERE id = 'public';
END
$$;

-- Verify RLS policies for the storage bucket
DO $$
BEGIN
  -- Check SELECT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Public Access'
  ) THEN
    EXECUTE 'CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = ''public'')';
    RAISE NOTICE 'Created Public Access policy for SELECT';
  END IF;

  -- Check INSERT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Upload Access'
  ) THEN
    EXECUTE 'CREATE POLICY "Upload Access" ON storage.objects FOR INSERT WITH CHECK (bucket_id = ''public'')';
    RAISE NOTICE 'Created Upload Access policy for INSERT';
  END IF;
  
  -- Make sure RLS is enabled on storage.objects
  ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
END
$$; 