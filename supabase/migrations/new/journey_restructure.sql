-- MIGRATION: Restructure Journey tables
-- This migration drops the old journey_milestones table and creates a new structure
-- with separate tables for journey entries and images, similar to the projects setup

-- Step 1: Drop the old journey_milestones table 
-- (but only if it exists to make the migration idempotent)
DROP TABLE IF EXISTS journey_milestones CASCADE;

-- Step 2: Create the new journey table
CREATE TABLE IF NOT EXISTS journey (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  year TEXT NOT NULL,
  description TEXT NOT NULL,
  skills TEXT[] NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Step 3: Create the journey_images table with a foreign key to journey
CREATE TABLE IF NOT EXISTS journey_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journey_id UUID NOT NULL REFERENCES journey(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Step 4: Create an index for faster lookups of images by journey_id
CREATE INDEX IF NOT EXISTS journey_images_journey_id_idx ON journey_images(journey_id);

-- Step 5: Enable Row Level Security (RLS) on both tables
ALTER TABLE journey ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_images ENABLE ROW LEVEL SECURITY;

-- Step 6: Create policies for public read access
-- For journey table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'journey' 
    AND policyname = 'Allow public read access'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow public read access" ON journey FOR SELECT USING (true)';
  END IF;
END
$$;

-- For journey_images table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'journey_images' 
    AND policyname = 'Allow public read access'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow public read access" ON journey_images FOR SELECT USING (true)';
  END IF;
END
$$;

-- Step 7: Create policies for authenticated users to manage journey entries and images
-- For journey table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'journey' 
    AND policyname = 'Allow authenticated users to manage journey'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow authenticated users to manage journey" ON journey USING (auth.role() = ''authenticated'') WITH CHECK (auth.role() = ''authenticated'')';
  END IF;
END
$$;

-- For journey_images table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'journey_images' 
    AND policyname = 'Allow authenticated users to manage journey_images'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow authenticated users to manage journey_images" ON journey_images USING (auth.role() = ''authenticated'') WITH CHECK (auth.role() = ''authenticated'')';
  END IF;
END
$$;

-- Step 8: Create an updated_at trigger function if it doesn't exist
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

-- Step 9: Apply the updated_at trigger to both tables
DROP TRIGGER IF EXISTS update_journey_updated_at ON journey;
CREATE TRIGGER update_journey_updated_at
BEFORE UPDATE ON journey
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_journey_images_updated_at ON journey_images;
CREATE TRIGGER update_journey_images_updated_at
BEFORE UPDATE ON journey_images
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Step 10: Create functions for managing journey entries and images that bypass schema cache
-- Function to create a journey entry
CREATE OR REPLACE FUNCTION create_journey(
  p_title TEXT,
  p_year TEXT,
  p_description TEXT,
  p_skills TEXT[],
  p_icon TEXT,
  p_color TEXT,
  p_display_order INTEGER
) RETURNS JSONB AS $$
DECLARE
  new_id UUID;
  result JSONB;
BEGIN
  -- Insert the journey entry
  EXECUTE format(
    'INSERT INTO journey (
      title, year, description, skills, icon, color, display_order
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7
    ) RETURNING id, created_at, updated_at'
  ) INTO new_id USING 
    p_title, p_year, p_description, p_skills, p_icon, p_color, p_display_order;
  
  -- Construct the response JSON
  result := jsonb_build_object(
    'id', new_id,
    'title', p_title,
    'year', p_year,
    'description', p_description,
    'skills', to_jsonb(p_skills),
    'icon', p_icon,
    'color', p_color,
    'display_order', p_display_order
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add a journey image
CREATE OR REPLACE FUNCTION add_journey_image(
  p_journey_id UUID,
  p_url TEXT,
  p_alt_text TEXT DEFAULT NULL,
  p_order_index INTEGER DEFAULT 0
) RETURNS JSONB AS $$
DECLARE
  new_id UUID;
  result JSONB;
BEGIN
  -- Insert the journey image
  EXECUTE format(
    'INSERT INTO journey_images (
      journey_id, url, alt_text, order_index
    ) VALUES (
      $1, $2, $3, $4
    ) RETURNING id, created_at, updated_at'
  ) INTO new_id USING 
    p_journey_id, p_url, p_alt_text, p_order_index;
  
  -- Construct the response JSON
  result := jsonb_build_object(
    'id', new_id,
    'journey_id', p_journey_id,
    'url', p_url,
    'alt_text', p_alt_text,
    'order_index', p_order_index
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION create_journey TO authenticated;
GRANT EXECUTE ON FUNCTION add_journey_image TO authenticated; 