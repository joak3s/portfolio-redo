-- Update tools table if icon column doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tools' AND column_name = 'icon') THEN
    ALTER TABLE public.tools ADD COLUMN icon TEXT;
  END IF;
  
  -- Add updated_at column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tools' AND column_name = 'updated_at') THEN
    ALTER TABLE public.tools ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
  END IF;
END
$$;

-- Update tags table if updated_at column doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tags' AND column_name = 'updated_at') THEN
    ALTER TABLE public.tags ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
  END IF;
END
$$;

-- Make sure handle_updated_at function exists
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add update trigger for tools if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_tools_updated_at') THEN
    CREATE TRIGGER handle_tools_updated_at BEFORE UPDATE ON public.tools
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END
$$;

-- Add update trigger for tags if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_tags_updated_at') THEN
    CREATE TRIGGER handle_tags_updated_at BEFORE UPDATE ON public.tags
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END
$$;

-- Add useful functions for tools and tags management

-- Function to add a tag (safe even if tag already exists)
CREATE OR REPLACE FUNCTION public.add_tag(
  p_name TEXT
) RETURNS UUID AS $$
DECLARE
  v_tag_id UUID;
BEGIN
  -- Check if tag already exists
  SELECT id INTO v_tag_id FROM public.tags WHERE name = p_name;
  
  -- If tag doesn't exist, create it
  IF v_tag_id IS NULL THEN
    INSERT INTO public.tags (name)
    VALUES (p_name)
    RETURNING id INTO v_tag_id;
  END IF;
  
  RETURN v_tag_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add a tool (safe even if tool already exists)
CREATE OR REPLACE FUNCTION public.add_tool(
  p_name TEXT,
  p_icon TEXT
) RETURNS UUID AS $$
DECLARE
  v_tool_id UUID;
BEGIN
  -- Check if tool already exists
  SELECT id INTO v_tool_id FROM public.tools WHERE name = p_name;
  
  -- If tool doesn't exist, create it
  IF v_tool_id IS NULL THEN
    INSERT INTO public.tools (name, icon)
    VALUES (p_name, p_icon)
    RETURNING id INTO v_tool_id;
  ELSE
    -- Update the icon if tool exists
    UPDATE public.tools
    SET icon = p_icon
    WHERE id = v_tool_id;
  END IF;
  
  RETURN v_tool_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete all tools
CREATE OR REPLACE FUNCTION public.delete_all_tools()
RETURNS void AS $$
BEGIN
  DELETE FROM public.tools;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete all project tools
CREATE OR REPLACE FUNCTION public.delete_all_project_tools()
RETURNS void AS $$
BEGIN
  DELETE FROM public.project_tools;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete all project tags
CREATE OR REPLACE FUNCTION public.delete_all_project_tags()
RETURNS void AS $$
BEGIN
  DELETE FROM public.project_tags;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing views if they exist
DROP VIEW IF EXISTS public.projects_with_tools CASCADE;
DROP VIEW IF EXISTS public.projects_with_tags CASCADE;
DROP VIEW IF EXISTS public.projects_summary CASCADE;

-- Create views for easier querying (these don't modify the underlying tables)

-- View for projects with their associated tools
CREATE OR REPLACE VIEW public.projects_with_tools AS
SELECT 
  p.id AS project_id,
  p.title AS project_title,
  p.slug AS project_slug,
  p.description AS project_description,
  p.summary AS project_summary,
  t.id AS tool_id,
  t.name AS tool_name,
  t.icon AS tool_icon
FROM 
  public.projects p
LEFT JOIN 
  public.project_tools pt ON p.id = pt.project_id
LEFT JOIN 
  public.tools t ON pt.tool_id = t.id;

-- View for projects with their associated tags
CREATE OR REPLACE VIEW public.projects_with_tags AS
SELECT 
  p.id AS project_id,
  p.title AS project_title,
  p.slug AS project_slug,
  p.description AS project_description,
  p.summary AS project_summary,
  t.id AS tag_id,
  t.name AS tag_name
FROM 
  public.projects p
LEFT JOIN 
  public.project_tags pt ON p.id = pt.project_id
LEFT JOIN 
  public.tags t ON pt.tag_id = t.id;

-- Simple view for projects with basic information
CREATE OR REPLACE VIEW public.projects_summary AS
SELECT 
  p.id,
  p.title,
  p.slug,
  p.description,
  p.summary,
  (
    SELECT COALESCE(json_agg(t.name), '[]'::json)
    FROM public.project_tools pt
    JOIN public.tools t ON pt.tool_id = t.id
    WHERE pt.project_id = p.id
  ) AS tools,
  (
    SELECT COALESCE(json_agg(t.name), '[]'::json)
    FROM public.project_tags ptag
    JOIN public.tags t ON ptag.tag_id = t.id
    WHERE ptag.project_id = p.id
  ) AS tags
FROM 
  public.projects p;
