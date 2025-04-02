-- Add updated_at column to journey_milestones if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'journey_milestones' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE journey_milestones 
    ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
  END IF;
END
$$;

-- Create or replace the function for setting updated_at automatically
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS set_timestamp ON journey_milestones;

-- Create the trigger
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON journey_milestones
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp(); 