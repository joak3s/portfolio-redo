-- Grant schema-level permissions first
GRANT USAGE ON SCHEMA storage TO postgres, authenticated, anon;

-- Grant table-level permissions
GRANT ALL ON ALL TABLES IN SCHEMA storage TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA storage TO postgres;
GRANT ALL ON ALL ROUTINES IN SCHEMA storage TO postgres;

GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

GRANT SELECT ON storage.objects TO anon;
GRANT SELECT ON storage.buckets TO anon;

-- Ensure the storage schema is in the search path
ALTER DATABASE postgres SET search_path TO public, storage, extensions;

-- Recreate the policies with explicit schema reference
DROP POLICY IF EXISTS "authenticated_access" ON storage.objects;
DROP POLICY IF EXISTS "public_read" ON storage.objects;

CREATE POLICY "authenticated_access"
ON storage.objects
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "public_read"
ON storage.objects
FOR SELECT
TO public
USING (true); 