-- Create 'public' storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, avif_autodetection)
VALUES ('public', 'public', true, false)
ON CONFLICT (id) DO NOTHING;

-- Set up bucket security for public access
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'public', 
  'public', 
  true, 
  5242880, -- 5MB file size limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']::text[]
)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']::text[];

-- Add RLS policy to allow unauthenticated users to read from the public bucket
CREATE POLICY IF NOT EXISTS "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'public');

-- Add RLS policy to allow authenticated users to upload to the public bucket
CREATE POLICY IF NOT EXISTS "Upload Access" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'public' AND 
    auth.role() = 'authenticated'
  );

-- Add RLS policy to allow authenticated users to update their own objects
CREATE POLICY IF NOT EXISTS "Owner Update Access" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'public' AND 
    auth.uid() = owner AND 
    auth.role() = 'authenticated'
  );

-- Add RLS policy to allow authenticated users to delete their own objects
CREATE POLICY IF NOT EXISTS "Owner Delete Access" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'public' AND 
    auth.uid() = owner AND 
    auth.role() = 'authenticated'
  ); 