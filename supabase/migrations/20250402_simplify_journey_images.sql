-- Migration to simplify journey milestone images
-- Step 1: Drop the journey_milestone_images table
DROP TABLE IF EXISTS journey_milestone_images CASCADE;

-- Step 2: Apply the simplified journey_milestones structure (if needed)
-- Add updated_at column with trigger
ALTER TABLE journey_milestones ADD COLUMN IF NOT EXISTS 
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL;

-- First check if the function already exists before creating it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'update_modified_column' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    -- Create the trigger function for updated_at
    EXECUTE '
    CREATE FUNCTION update_modified_column()
    RETURNS TRIGGER AS $body$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $body$ LANGUAGE plpgsql';
  END IF;
END $$;

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