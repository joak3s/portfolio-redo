-- Fix permissions specifically for the journey_milestones folder
-- This script adds extra permissive policies for the journey_milestones folder

-- Drop any existing policies with similar names
DROP POLICY IF EXISTS "Journey Milestones Access" ON storage.objects;
DROP POLICY IF EXISTS "Journey Milestones Upload" ON storage.objects;

-- Create specific policies for the journey_milestones folder
CREATE POLICY "Journey Milestones Access" ON storage.objects
  FOR SELECT 
  USING (
    bucket_id = 'public' AND 
    (storage.foldername(name))[1] = 'journey_milestones'
  );

CREATE POLICY "Journey Milestones Upload" ON storage.objects
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'public' AND 
    (storage.foldername(name))[1] = 'journey_milestones'
  );

-- Ensure the folder exists by creating a placeholder file if needed
DO $$
DECLARE
  file_exists boolean;
BEGIN
  -- Check if any files exist in the journey_milestones folder
  SELECT EXISTS (
    SELECT 1 FROM storage.objects
    WHERE bucket_id = 'public' AND 
          name LIKE 'journey_milestones/%'
  ) INTO file_exists;
  
  -- If no files exist, create a placeholder file
  IF NOT file_exists THEN
    -- This is executed as a stored procedure so the auth.uid() isn't available
    -- We'll insert without an owner, which makes it accessible to everyone
    BEGIN
      INSERT INTO storage.objects (bucket_id, name, owner, metadata)
      VALUES (
        'public', 
        'journey_milestones/.folder', 
        NULL,
        '{"contentType": "application/x-directory"}'
      );
      RAISE NOTICE 'Created journey_milestones folder placeholder';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not create folder placeholder: %', SQLERRM;
    END;
  END IF;
END
$$; 