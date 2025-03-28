-- Create the journey_milestone_images table
CREATE TABLE IF NOT EXISTS journey_milestone_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  milestone_id UUID REFERENCES journey_milestones(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE journey_milestone_images ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access" ON journey_milestone_images
  FOR SELECT USING (true);

-- Create policy for authenticated users to manage images
CREATE POLICY "Allow authenticated users to manage milestone images" ON journey_milestone_images
  USING (auth.role() = 'authenticated');
  
-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_journey_milestone_images_updated_at
BEFORE UPDATE ON journey_milestone_images
FOR EACH ROW
EXECUTE FUNCTION update_modified_column(); 