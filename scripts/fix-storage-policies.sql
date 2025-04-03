-- Fix storage permissions for the public bucket
-- This script makes the policies more permissive to allow anonymous uploads

-- Enable RLS on the objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them fresh
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Upload Access" ON storage.objects;
DROP POLICY IF EXISTS "Owner Update Access" ON storage.objects;
DROP POLICY IF EXISTS "Owner Delete Access" ON storage.objects;

-- Create policies with permissive permissions - allowing anonymous uploads
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'public');

-- Allow anon role to upload (this is critical for browser clients)
CREATE POLICY "Upload Access" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'public' AND 
    (auth.role() = 'anon' OR auth.role() = 'authenticated')
  );

-- Simple policies for update and delete with role restrictions
CREATE POLICY "Owner Update Access" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'public' AND
    (auth.role() = 'anon' OR auth.role() = 'authenticated')
  );

CREATE POLICY "Owner Delete Access" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'public' AND
    (auth.role() = 'anon' OR auth.role() = 'authenticated')
  );

-- Show current state of policies
SELECT 
  policyname, 
  permissive, 
  tablename, 
  format('%I.%I', schemaname, tablename) as table_name, 
  (regexp_match(definition, 'USING \((.+)\)'))[1] as using_expression,  
  (regexp_match(definition, 'WITH CHECK \((.+)\)'))[1] as with_check_expression
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage'; 