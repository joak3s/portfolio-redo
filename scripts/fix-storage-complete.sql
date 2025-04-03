-- Complete fix for Supabase storage permissions
-- This is a simplified approach that disables RLS entirely for testing

-- First, ensure the storage schema is properly set up
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'storage') THEN
    CREATE SCHEMA storage;
  END IF;
END
$$;

-- Make sure the buckets table exists
CREATE TABLE IF NOT EXISTS storage.buckets (
  id text PRIMARY KEY,
  name text NOT NULL,
  owner uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  public boolean DEFAULT false,
  avif_autodetection boolean DEFAULT false,
  file_size_limit bigint,
  allowed_mime_types text[]
);

-- Make sure the objects table exists
CREATE TABLE IF NOT EXISTS storage.objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id text,
  name text,
  owner uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_accessed_at timestamptz DEFAULT now(),
  metadata jsonb,
  path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/')) STORED,
  CONSTRAINT objects_bucketid_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id)
);

-- Create or update the public bucket with permissive settings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'public', 
  'public', 
  true, 
  5242880, -- 5MB
  NULL -- Allow all MIME types for testing
)
ON CONFLICT (id) 
DO UPDATE SET 
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = NULL; -- Allow all MIME types for testing

-- Disable RLS entirely on storage.objects
-- This will allow all operations without any restrictions
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Create the journey_milestones folder if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.objects 
    WHERE bucket_id = 'public' AND name = 'journey_milestones/.folder'
  ) THEN
    INSERT INTO storage.objects (bucket_id, name, metadata)
    VALUES (
      'public', 
      'journey_milestones/.folder', 
      '{"contentType": "application/x-directory"}'
    );
    RAISE NOTICE 'Created journey_milestones folder';
  ELSE
    RAISE NOTICE 'journey_milestones folder already exists';
  END IF;
END
$$; 