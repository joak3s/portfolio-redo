# Manual Migration Steps

## Simplifying Journey Milestone Images

Follow these steps to manually execute the database migration script in the Supabase dashboard:

1. Log in to your Supabase account at [app.supabase.com](https://app.supabase.com/)
2. Navigate to your project: [https://app.supabase.com/project/lgtldjzglbzlmmxphfxw/sql](https://app.supabase.com/project/lgtldjzglbzlmmxphfxw/sql)
3. Go to the SQL Editor section
4. Click "New Query" to create a new SQL script
5. Copy and paste the following SQL code:

```sql
-- Migration to simplify journey milestone images
-- Step 1: Drop the journey_milestone_images table
DROP TABLE IF EXISTS journey_milestone_images CASCADE;

-- Step 2: Apply the simplified journey_milestones structure (if needed)
-- Add updated_at column with trigger
ALTER TABLE journey_milestones ADD COLUMN IF NOT EXISTS 
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL;

-- Create or replace the trigger function for updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
      SELECT 1 FROM pg_trigger WHERE tgname = 'update_journey_milestones_updated_at'
  ) THEN
      CREATE TRIGGER update_journey_milestones_updated_at
      BEFORE UPDATE ON journey_milestones
      FOR EACH ROW
      EXECUTE FUNCTION update_modified_column();
  END IF;
END
$$;
```

6. Click the "Run" button to execute the SQL
7. Verify the execution was successful by checking that:
   - No errors appear in the output
   - The `journey_milestone_images` table is no longer visible in the Table Editor
   - The `journey_milestones` table now has an `updated_at` column

## Migration Explanation

This migration does the following:

1. Drops the `journey_milestone_images` table since we're simplifying to use a single image per milestone
2. Adds an `updated_at` column to the `journey_milestones` table (if it doesn't already exist)
3. Creates a trigger function that automatically updates the `updated_at` timestamp whenever a record is modified
4. Adds a trigger to the `journey_milestones` table that uses this function

## Checking Migration Success

After running the migration, you can verify it was successful by running the following queries:

```sql
-- Check if journey_milestone_images table exists (should return no rows)
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'journey_milestone_images'
);

-- Check if journey_milestones has updated_at column (should return a row)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'journey_milestones' 
AND column_name = 'updated_at';

-- Check if the trigger exists (should return a row)
SELECT tgname 
FROM pg_trigger 
WHERE tgname = 'update_journey_milestones_updated_at';
``` 