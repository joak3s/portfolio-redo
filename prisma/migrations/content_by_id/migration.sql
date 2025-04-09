-- Function to get content by ID and type
CREATE OR REPLACE FUNCTION "public"."get_content_by_id"(p_content_id uuid, p_content_type text)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  result jsonb;
  first_image_url text;
  gallery_images_json jsonb;
BEGIN
  IF p_content_type = 'project' THEN
    -- Get the first image URL
    SELECT pi.url INTO first_image_url
    FROM public.project_images pi 
    WHERE pi.project_id = p_content_id 
    ORDER BY pi.order_index ASC 
    LIMIT 1;
    
    -- Get gallery images as JSON array
    SELECT jsonb_agg(jsonb_build_object(
      'url', pi.url,
      'alt_text', pi.alt_text
    ))
    INTO gallery_images_json
    FROM public.project_images pi
    WHERE pi.project_id = p_content_id
    ORDER BY pi.order_index ASC;
    
    -- Build the project result with the separately queried images
    SELECT jsonb_build_object(
      'id', p.id,
      'name', p.title,
      'slug', p.slug,
      'description', p.description,
      'summary', p.summary,
      'approach', p.approach,
      'solution', p.solution,
      'results', p.results,
      'status', p.status,
      'published', (p.status = 'published'),
      'image_url', first_image_url,
      'gallery_images', gallery_images_json
    ) INTO result
    FROM public.projects p
    WHERE p.id = p_content_id;
  ELSE
    -- For general content
    SELECT jsonb_build_object(
      'id', c.id,
      'title', c.title,
      'type', 'general_info',
      'content', c.content,
      'published', true
    ) INTO result
    FROM public.general_info c
    WHERE c.id = p_content_id;
  END IF;
  
  RETURN result;
END;
$$; 