-- Drop the existing function
DROP FUNCTION IF EXISTS hybrid_search;

-- Create improved hybrid search function with both vector and text search
-- Now using p.summary instead of p.description for richer project content
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

  -- Semantic search results using embeddings
  WITH vector_search AS (
    SELECT 
      e.content_id AS vector_content_id,
      e.content_type AS vector_content_type,
      1 - (e.embedding <=> query_embedding) AS vector_similarity
    FROM 
      embeddings e
    WHERE 
      1 - (e.embedding <=> query_embedding) > match_threshold
    ORDER BY 
      vector_similarity DESC
    LIMIT match_count
  ),
  
  -- Keyword-based search in general_info table
  general_info_search AS (
    SELECT
      g.id AS text_content_id,
      'general_info'::TEXT AS text_content_type,
      0.8::FLOAT AS text_similarity
    FROM
      general_info g
    WHERE
      g.content ILIKE '%' || query_text || '%'
      OR g.title ILIKE '%' || query_text || '%'
      OR g.category ILIKE '%' || query_text || '%'
    LIMIT match_count
  ),
  
  -- Keyword-based search in projects table
  -- Updated to use summary instead of description
  project_search AS (
    SELECT
      p.id AS text_content_id,
      'project'::TEXT AS text_content_type,
      0.7::FLOAT AS text_similarity
    FROM
      projects p
    WHERE
      p.title ILIKE '%' || query_text || '%'
      OR p.summary ILIKE '%' || query_text || '%'
      OR p.slug ILIKE '%' || query_text || '%'
    LIMIT match_count
  ),
  
  -- Combine text searches
  text_search AS (
    SELECT * FROM general_info_search
    UNION ALL
    SELECT * FROM project_search
  ),
  
  -- Combine both search approaches
  all_searches AS (
    -- Vector search results
    SELECT 
      vector_content_id AS result_content_id,
      vector_content_type AS result_content_type,
      vector_similarity AS result_similarity,
      'vector'::TEXT AS search_type
    FROM 
      vector_search
    
    UNION ALL
    
    -- Text search results
    SELECT 
      text_content_id AS result_content_id,
      text_content_type AS result_content_type,
      text_similarity AS result_similarity,
      'text'::TEXT AS search_type
    FROM 
      text_search
  ),
  
  -- Get the highest similarity score for each content item
  ranked_results AS (
    SELECT DISTINCT ON (result_content_id, result_content_type)
      result_content_id,
      result_content_type,
      result_similarity
    FROM
      all_searches
    ORDER BY
      result_content_id, result_content_type, result_similarity DESC
  ),
  
  -- Retrieve content data
  content_data AS (
    -- Project data - updated to use summary instead of description
    SELECT 
      p.id AS data_content_id,
      'project'::TEXT AS data_content_type,
      jsonb_build_object(
        'name', p.title,
        'slug', p.slug,
        'summary', p.summary,
        'features', p.features,
        'url', p.url,
        'image_url', p.image_url,
        'keywords', ARRAY[]::TEXT[]
      ) AS data_content
    FROM 
      projects p
    
    UNION ALL
    
    -- General info data
    SELECT 
      g.id AS data_content_id,
      'general_info'::TEXT AS data_content_type,
      jsonb_build_object(
        'title', g.title,
        'content', g.content,
        'category', g.category
      ) AS data_content
    FROM 
      general_info g
  )
  
  -- Final result combining rankings with content
  SELECT 
    rr.result_content_id AS content_id,
    rr.result_content_type AS content_type,
    rr.result_similarity AS similarity,
    cd.data_content AS content
  FROM 
    ranked_results rr
  JOIN 
    content_data cd ON rr.result_content_id = cd.data_content_id AND rr.result_content_type = cd.data_content_type
  ORDER BY 
    rr.result_similarity DESC
  LIMIT match_count;
  
END;
$$; 