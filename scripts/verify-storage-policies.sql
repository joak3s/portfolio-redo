-- Check if RLS is enabled
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'objects' 
AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'storage');

-- Check existing policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects';

-- Check bucket existence and configuration
SELECT * FROM storage.buckets WHERE id = 'project-images';

-- Check permissions for authenticated and anon roles
SELECT 
    r.rolname, 
    has_table_privilege(r.rolname, 'storage.objects', 'SELECT') as can_select,
    has_table_privilege(r.rolname, 'storage.objects', 'INSERT') as can_insert,
    has_table_privilege(r.rolname, 'storage.objects', 'UPDATE') as can_update,
    has_table_privilege(r.rolname, 'storage.objects', 'DELETE') as can_delete
FROM pg_roles r
WHERE r.rolname IN ('authenticated', 'anon', 'service_role'); 