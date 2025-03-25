-- Reset all storage permissions
DROP POLICY IF EXISTS "Allow full access to project-images bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to project-images bucket" ON storage.objects;
DROP POLICY IF EXISTS "Enable read access for all users" ON storage.objects;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON storage.objects;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create a single permissive policy for authenticated users
CREATE POLICY "authenticated_access"
ON storage.objects
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create a public read policy
CREATE POLICY "public_read"
ON storage.objects
FOR SELECT
TO public
USING (true);

-- Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO anon;
GRANT USAGE ON SCHEMA storage TO authenticated, anon;

-- Ensure bucket exists with public access
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-images', 'project-images', true)
ON CONFLICT (id) DO UPDATE
SET public = true; 