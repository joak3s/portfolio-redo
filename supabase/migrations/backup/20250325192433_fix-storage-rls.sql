-- Drop existing policies
DROP POLICY IF EXISTS "Allow full access to project-images bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to project-images bucket" ON storage.objects;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows authenticated users full access to project-images bucket
CREATE POLICY "Allow full access to project-images bucket"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'project-images')
WITH CHECK (bucket_id = 'project-images');

-- Create a policy that allows public read access to project-images bucket
CREATE POLICY "Allow public read access to project-images bucket"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'project-images');

-- Ensure proper permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO anon;
GRANT USAGE ON SCHEMA storage TO authenticated, anon;

-- Ensure the bucket exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets
        WHERE id = 'project-images'
    ) THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('project-images', 'project-images', true);
    END IF;
END $$;
