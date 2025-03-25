-- Update project_images table
CREATE TABLE IF NOT EXISTS public.project_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    alt_text TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS project_images_project_id_idx ON public.project_images(project_id);
CREATE INDEX IF NOT EXISTS project_images_order_index_idx ON public.project_images(order_index);

-- Enable RLS
ALTER TABLE public.project_images ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON public.project_images
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON public.project_images
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users only" ON public.project_images
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users only" ON public.project_images
    FOR DELETE
    TO authenticated
    USING (true);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_project_images_updated_at ON public.project_images;

CREATE TRIGGER update_project_images_updated_at
    BEFORE UPDATE ON public.project_images
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 