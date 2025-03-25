-- First, drop all existing policies for the project-images bucket
DROP POLICY IF EXISTS "Enable read access for all users" ON storage.objects;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON storage.objects;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create a single, more permissive policy for the project-images bucket
CREATE POLICY "Allow full access to project-images bucket"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'project-images')
WITH CHECK (bucket_id = 'project-images');

-- Create a separate policy for public read access
CREATE POLICY "Allow public read access to project-images bucket"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'project-images');

-- Ensure proper permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO anon;
GRANT USAGE ON SCHEMA storage TO authenticated, anon;

-- Verify the bucket exists
DO $$
BEGIN
    -- Check if bucket exists
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets WHERE id = 'project-images'
    ) THEN
        -- Create the bucket if it doesn't exist
        INSERT INTO storage.buckets (id, name)
        VALUES ('project-images', 'project-images');
    END IF;
END $$; 