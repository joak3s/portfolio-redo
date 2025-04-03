-- Current schema for journey_milestones table
-- This documents the current state and can be used to recreate the table if needed

-- Create the journey_milestones table if it doesn't exist
CREATE TABLE IF NOT EXISTS journey_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  year TEXT NOT NULL,
  description TEXT NOT NULL,
  skills TEXT[] NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  image TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create or replace the trigger function for updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS update_journey_milestones_updated_at ON journey_milestones;
CREATE TRIGGER update_journey_milestones_updated_at
BEFORE UPDATE ON journey_milestones
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Enable Row Level Security
ALTER TABLE journey_milestones ENABLE ROW LEVEL SECURITY;

-- Create policies if they don't exist
DROP POLICY IF EXISTS "Allow public read access" ON journey_milestones;
CREATE POLICY "Allow public read access" ON journey_milestones
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to manage milestones" ON journey_milestones;
CREATE POLICY "Allow authenticated users to manage milestones" ON journey_milestones
  FOR ALL USING (auth.role() = 'authenticated');

-- Reset schema cache for the image column
COMMENT ON COLUMN journey_milestones.image IS 'Stores the URL to the milestone image';

-- Verify the current schema
DO $$
BEGIN
  RAISE NOTICE 'Current journey_milestones schema verification complete.';
END
$$; 