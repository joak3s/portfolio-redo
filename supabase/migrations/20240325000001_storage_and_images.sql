-- Enable storage schema access
GRANT USAGE ON SCHEMA storage TO postgres, authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA storage TO postgres, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA storage TO postgres, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA storage TO postgres, authenticated;
GRANT SELECT ON storage.objects TO anon;
GRANT SELECT ON storage.buckets TO anon;

-- Ensure storage schema in search path
ALTER DATABASE postgres SET search_path TO public, storage, extensions;

-- Configure storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-images', 'project-images', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Storage policies
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users full access to project-images bucket" ON storage.objects;
CREATE POLICY "Allow authenticated users full access to project-images bucket"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'project-images')
WITH CHECK (bucket_id = 'project-images');

DROP POLICY IF EXISTS "Allow public read access to project-images bucket" ON storage.objects;
CREATE POLICY "Allow public read access to project-images bucket"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'project-images');

-- Project images table and related objects
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

-- Enable RLS on project_images
ALTER TABLE public.project_images ENABLE ROW LEVEL SECURITY;

-- Project images policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.project_images;
CREATE POLICY "Enable read access for all users" ON public.project_images
    FOR SELECT TO public
    USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = project_images.project_id
            AND (p.status = 'published' OR auth.role() = 'authenticated')
        )
    );

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.project_images;
CREATE POLICY "Enable insert for authenticated users" ON public.project_images
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = project_id
        )
    );

DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.project_images;
CREATE POLICY "Enable update for authenticated users" ON public.project_images
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = project_id
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = project_id
        )
    );

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.project_images;
CREATE POLICY "Enable delete for authenticated users" ON public.project_images
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = project_id
        )
    );

-- Add updated_at trigger
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