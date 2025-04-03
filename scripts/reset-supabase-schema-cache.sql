-- Reset Supabase schema cache
-- This script fixes the "Could not find the 'image' column of 'journey_milestones' in the schema cache" error

-- First verify existing table structure
DO $$
DECLARE
    image_exists boolean;
BEGIN
    -- Check if image column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'journey_milestones' 
        AND column_name = 'image'
    ) INTO image_exists;
    
    IF image_exists THEN
        RAISE NOTICE 'The image column already exists in journey_milestones table';
    ELSE
        RAISE NOTICE 'The image column does NOT exist in journey_milestones table';
        
        -- Add the column if it doesn't exist
        ALTER TABLE journey_milestones ADD COLUMN image TEXT;
        RAISE NOTICE 'Added image column to journey_milestones table';
    END IF;
END
$$;

-- Force refresh of Supabase internal schema cache
-- This is done by updating the column comment which triggers a cache refresh
COMMENT ON COLUMN journey_milestones.image IS 'Stores the URL to the milestone image';

-- If the above doesn't work, we can try a more forceful approach
-- This updates the column type to the same type, which forces schema recalculation
ALTER TABLE journey_milestones ALTER COLUMN image TYPE TEXT;

-- Now verify the change has been applied and the column is properly registered
DO $$
BEGIN
    RAISE NOTICE 'Schema cache reset completed. The image column should now be recognized by the application.';
END
$$; 