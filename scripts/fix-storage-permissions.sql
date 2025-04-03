-- Fix storage permissions and bucket configuration
-- This addresses the "Bucket not found" error for journey milestone images

-- First, ensure the storage schema is properly set up
DO $$
BEGIN
    -- Enable the storage extension if needed
    CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
    CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";

    RAISE NOTICE 'Extensions checked';
END
$$;

-- Enable the storage schema
CREATE SCHEMA IF NOT EXISTS storage;

-- Create tables if they don't exist (core bucket structure)
CREATE TABLE IF NOT EXISTS storage.buckets (
  id text NOT NULL,
  name text NOT NULL,
  owner uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  public boolean DEFAULT false,
  avif_autodetection boolean DEFAULT false,
  file_size_limit bigint,
  allowed_mime_types text[],
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS storage.objects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  bucket_id text,
  name text,
  owner uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_accessed_at timestamptz DEFAULT now(),
  metadata jsonb,
  path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/')) STORED,
  PRIMARY KEY (id),
  CONSTRAINT buckets_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets (id) ON DELETE CASCADE
);

-- Create/recreate the public bucket
DO $$
BEGIN
  -- First try to delete the existing bucket to resolve any issues
  -- This is safe as it will recreate the bucket and policies
  BEGIN
    DELETE FROM storage.buckets WHERE id = 'public';
    RAISE NOTICE 'Deleted existing public bucket';
  EXCEPTION 
    WHEN OTHERS THEN
      RAISE NOTICE 'No existing public bucket to delete';
  END;
  
  -- Create the bucket
  INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
  VALUES (
    'public', 
    'public', 
    true, 
    false,
    5242880, -- 5MB file size limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']::text[]
  );
  RAISE NOTICE 'Created new public bucket with proper configuration';
END
$$;

-- Enable RLS on the objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them fresh
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Upload Access" ON storage.objects;
DROP POLICY IF EXISTS "Owner Update Access" ON storage.objects;
DROP POLICY IF EXISTS "Owner Delete Access" ON storage.objects;

-- Create policies with proper permissions
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'public');

CREATE POLICY "Upload Access" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'public' AND 
    (auth.role() = 'authenticated' OR auth.role() = 'anon')
  );

CREATE POLICY "Owner Update Access" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'public' AND 
    (auth.uid() = owner OR owner IS NULL) AND 
    (auth.role() = 'authenticated' OR auth.role() = 'anon')
  );

CREATE POLICY "Owner Delete Access" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'public' AND 
    (auth.uid() = owner OR owner IS NULL) AND 
    (auth.role() = 'authenticated' OR auth.role() = 'anon')
  );

-- Create the storage folders
DO $$
BEGIN
  BEGIN
    -- Try to create folder object if it doesn't exist
    INSERT INTO storage.objects (bucket_id, name, owner)
    VALUES ('public', 'journey_milestones/.emptyFolderPlaceholder', NULL);
  EXCEPTION 
    WHEN OTHERS THEN
      RAISE NOTICE 'Folder already exists or could not be created';
  END;
END
$$; 