-- Grant necessary permissions to the storage schema and its objects
GRANT USAGE ON SCHEMA storage TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA storage TO postgres, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA storage TO postgres, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA storage TO postgres, authenticated, service_role;

-- Ensure public read access
GRANT SELECT ON storage.objects TO anon;

-- Ensure the storage schema exists in search_path
ALTER DATABASE postgres SET search_path TO public, storage, extensions; 