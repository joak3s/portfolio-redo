CREATE OR REPLACE FUNCTION get_content_by_id(p_content_id uuid, p_content_type text)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  result jsonb;
BEGIN
  IF p_content_type = 'project' THEN
    SELECT jsonb_build_object(
      'id', p.id,
      'name', p.name,
      'slug', p.slug,
      'description', p.description,
      'summary', p.summary,
      'timeline', p.timeline,
      'tools', p.tools,
      'client', p.client,
      'published', p.published,
      'image_url', p.image_url,
      'gallery_images', p.gallery_images
    ) INTO result
    FROM projects p
    WHERE p.id = p_content_id;
  ELSE
    SELECT jsonb_build_object(
      'id', c.id,
      'title', c.title,
      'type', c.type,
      'content', c.content,
      'published', c.published
    ) INTO result
    FROM content c
    WHERE c.id = p_content_id;
  END IF;
  
  RETURN result;
END;
$$; 