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

-- Enable Row Level Security
ALTER TABLE journey_milestones ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'journey_milestones' 
    AND policyname = 'Allow public read access'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow public read access" ON journey_milestones FOR SELECT USING (true)';
  END IF;
END
$$;

-- Create policy for authenticated users to manage milestones
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'journey_milestones' 
    AND policyname = 'Allow authenticated users to manage milestones'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow authenticated users to manage milestones" ON journey_milestones USING (auth.role() = ''authenticated'')';
  END IF;
END
$$;

-- Insert sample data
INSERT INTO journey_milestones (title, year, description, skills, icon, color, image, display_order)
VALUES
  (
    'Tear Drop Artwork', 
    '2010', 
    'This is one of my first art projects using Adobe Photoshop. The feeling of letting go was the inspiration behind this project. I learned the basics of Photoshop by following tutorials, but I found that starting with inspiration how to create it worked best for me.', 
    ARRAY['Photoshop', 'Digital Art', 'Creative Composition'], 
    'image', 
    'bg-blue-500/10 dark:bg-blue-500/20', 
    '/images/journey/teardrop.jpg', 
    1
  ),
  (
    'World Rugby Ball', 
    '2011', 
    'Rugby is my passion and I made this artwork inspired by how the sport of rugby can unite people around the world despite borders that divide us. This project developed my skills in digital illustration and global visual storytelling.', 
    ARRAY['Photoshop', 'Illustrator', 'Global Design'], 
    'image', 
    'bg-green-500/10 dark:bg-green-500/20', 
    '/images/journey/world-rugby.jpg', 
    2
  ),
  (
    '3D Dream House', 
    '2013', 
    'In San Diego, I took an architecture class on ArchiCAD. Our goal was to design a house, but I took it a step further and made my dream house. A giant backyard complete with a rugby pitch, basketball court and pool makes me feel right at home.', 
    ARRAY['ArchiCAD', '3D Modeling', 'Architectural Design'], 
    'layout', 
    'bg-purple-500/10 dark:bg-purple-500/20', 
    '/images/journey/dream-house.jpg', 
    3
  ),
  (
    'Digital Fabrication', 
    '2015', 
    'The Cabrillo College Fabrication Lab offered a CNC Router and Laser Engraver that I used to fabricate designs. I combined my graphic design skills with these tools to create physical artwork from digital designs.', 
    ARRAY['CNC Routing', 'Laser Engraving', 'Digital-to-Physical Design'], 
    'tool', 
    'bg-orange-500/10 dark:bg-orange-500/20', 
    '/images/journey/fabrication.jpg', 
    4
  ),
  (
    'River City Travel Ball', 
    '2021', 
    'A baseball tournament host needed to rebrand with a new logo and website. I created a logo that combines a baseball, banner and home plate while sticking to their established brand''s colors of red, white and blue. This project combined brand development, web design, and sports marketing.', 
    ARRAY['Adobe Illustrator', 'Webflow', 'Brand Identity', 'Web Design'], 
    'briefcase', 
    'bg-blue-700/10 dark:bg-blue-700/20', 
    'https://uploads-ssl.webflow.com/5ff37b5114e532c818a78a70/6297aa3786c9a627a25a2fbb_RCTB-Main-Logo-Square.svg', 
    5
  ),
  (
    'Portfolio Website', 
    '2024', 
    'Created this portfolio application using Next.js, TypeScript, and Supabase, combining all my previous skills. This project represents the culmination of my journey so far, showcasing my ability to create comprehensive digital experiences with modern web technologies.', 
    ARRAY['Next.js', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'Supabase'], 
    'code', 
    'bg-pink-500/10 dark:bg-pink-500/20', 
    '/images/journey/portfolio.jpg', 
    6
  );
