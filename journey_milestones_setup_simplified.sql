-- Create the journey_milestones table
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

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

-- Enable Row Level Security
ALTER TABLE journey_milestones ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY IF NOT EXISTS "Allow public read access" ON journey_milestones
  FOR SELECT USING (true);

-- Create policy for authenticated users to manage milestones
CREATE POLICY IF NOT EXISTS "Allow authenticated users to manage milestones" ON journey_milestones
  FOR ALL USING (auth.role() = 'authenticated');

-- Note: Sample data insertion is commented out to prevent duplicate inserts
-- Uncomment and run this section only if you need to populate the table with initial data
/*
INSERT INTO journey_milestones (title, year, description, skills, icon, color, image, display_order)
VALUES
  (
    'First Graphic Design Commission', 
    '2015', 
    'Created my first paid graphic design project, developing a logo and brand identity for a local business. This project sparked my passion for visual communication and design thinking.', 
    ARRAY['Adobe Illustrator', 'Brand Design', 'Typography', 'Client Communication'], 
    'image', 
    'bg-yellow-500/10 dark:bg-yellow-500/20', 
    '/images/journey/graphic-design.jpg', 
    1
  ),
  (
    'UC Santa Cruz - Cognitive Science', 
    '2018', 
    'Graduated with a degree that combines psychology, computer science, and design. My studies in how humans interact with technology have formed the foundation of my user-centered approach to design.', 
    ARRAY['Cognitive Psychology', 'Programming Fundamentals', 'HCI Research', 'Information Architecture'], 
    'briefcase', 
    'bg-blue-500/10 dark:bg-blue-500/20', 
    '/images/journey/education.jpg', 
    2
  ),
  (
    'Precision Mercedes', 
    '2020', 
    'Secured my first web design client, creating a comprehensive digital presence including website design, graphic elements, and motion graphics. This project marked my transition from graphic design to digital experiences.', 
    ARRAY['Web Design', 'HTML/CSS', 'Motion Graphics', 'Client Presentations'], 
    'layout', 
    'bg-green-500/10 dark:bg-green-500/20', 
    '/images/journey/web-design.jpg', 
    3
  ),
  (
    'Off The Leash Lifestyle', 
    '2021', 
    'Designed and developed a complete e-commerce platform for a lifestyle brand, integrating social media strategy with online shopping. This project expanded my skills in conversion-focused design and user journey mapping.', 
    ARRAY['E-commerce', 'UI/UX Design', 'Social Media Integration', 'Brand Strategy'], 
    'layout', 
    'bg-purple-500/10 dark:bg-purple-500/20', 
    '/images/journey/ecommerce.jpg', 
    4
  ),
  (
    'Aletheia Digital Media', 
    '2022', 
    'Joined a digital agency as lead designer and developer, where I rebuilt their company website and created digital solutions for multiple clients. This role strengthened my project management skills and ability to translate business requirements into technical solutions.', 
    ARRAY['Team Leadership', 'WordPress', 'Client Management', 'Project Planning'], 
    'briefcase', 
    'bg-blue-500/10 dark:bg-blue-500/20', 
    '/images/journey/agency.jpg', 
    5
  ),
  (
    'Swyvvl Real Estate Platform', 
    '2023', 
    'Designed and developed a comprehensive real estate platform combining elegant UI with complex functionality. This project showcased my evolution into a complete product designer with both front-end and back-end capabilities.', 
    ARRAY['React', 'Next.js', 'UI Design', 'Database Architecture', 'Full-Stack Development'], 
    'code', 
    'bg-red-500/10 dark:bg-red-500/20', 
    '/images/journey/fullstack.jpg', 
    6
  ),
  (
    'AI Integration Specialist', 
    '2024', 
    'Advanced to creating AI-enhanced applications that combine my design expertise with cutting-edge technology. These projects represent the culmination of my journey from graphic designer to full-stack developer and AI specialist.', 
    ARRAY['OpenAI Integration', 'Vector Databases', 'TypeScript', 'Supabase', 'Modern UI Frameworks'], 
    'code', 
    'bg-indigo-500/10 dark:bg-indigo-500/20', 
    '/images/journey/ai-specialist.jpg', 
    7
  )
*/ 