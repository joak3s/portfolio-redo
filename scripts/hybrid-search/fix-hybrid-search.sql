-- Drop the existing function
DROP FUNCTION IF EXISTS hybrid_search;

-- Create improved hybrid search function with both vector and text search
CREATE OR REPLACE FUNCTION hybrid_search(
  query_embedding VECTOR(1536),
  query_text TEXT,
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 10
) RETURNS TABLE (
  content_id UUID,
  content_type TEXT,
  similarity FLOAT,
  content JSONB
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  WITH vector_matches AS (
    SELECT 
      e.content_id,
      e.content_type,
      1 - (e.embedding <=> query_embedding) as similarity
    FROM 
      embeddings e
    WHERE 
      1 - (e.embedding <=> query_embedding) > match_threshold
    ORDER BY 
      similarity DESC
    LIMIT match_count
  ),
  text_matches AS (
    -- Search general_info using text search
    SELECT
      g.id as content_id,
      'general_info' as content_type,
      0.8 as similarity -- Give text matches a reasonable similarity score
    FROM
      general_info g
    WHERE
      g.content ILIKE '%' || query_text || '%'
      OR g.title ILIKE '%' || query_text || '%'
      OR g.category ILIKE '%' || query_text || '%'
    
    UNION ALL
    
    -- Search projects using text search
    SELECT
      p.id as content_id,
      'project' as content_type,
      0.7 as similarity -- Slightly lower than general_info for ranking
    FROM
      projects p
    WHERE
      p.title ILIKE '%' || query_text || '%'
      OR p.description ILIKE '%' || query_text || '%'
      OR p.slug ILIKE '%' || query_text || '%'
    
    LIMIT match_count
  ),
  -- Combine vector and text matches
  combined_matches AS (
    SELECT * FROM vector_matches
    UNION ALL
    SELECT * FROM text_matches
  ),
  -- Get the highest similarity score for each content
  ranked_matches AS (
    SELECT DISTINCT ON (cm.content_id, cm.content_type)
      cm.content_id,
      cm.content_type,
      cm.similarity
    FROM
      combined_matches cm
    ORDER BY
      cm.content_id, cm.content_type, cm.similarity DESC
  ),
  content_data AS (
    -- Get project data
    SELECT 
      p.id as content_id,
      'project' as content_type,
      jsonb_build_object(
        'name', p.title,
        'slug', p.slug,
        'summary', p.description,
        'keywords', ARRAY[]::TEXT[]
      ) as content
    FROM 
      projects p
    UNION ALL
    -- Get general info data
    SELECT 
      g.id as content_id,
      'general_info' as content_type,
      jsonb_build_object(
        'title', g.title,
        'content', g.content,
        'category', g.category
      ) as content
    FROM 
      general_info g
  )
  SELECT 
    rm.content_id,
    rm.content_type,
    rm.similarity,
    cd.content
  FROM 
    ranked_matches rm
  JOIN 
    content_data cd ON rm.content_id = cd.content_id AND rm.content_type = cd.content_type
  ORDER BY 
    rm.similarity DESC
  LIMIT match_count;
END;
$$; 