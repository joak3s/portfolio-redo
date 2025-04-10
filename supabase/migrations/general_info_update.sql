-- Migration to enhance the general_info table with additional fields
-- This adds fields for tracking embedding relations, relevance scoring, and content chunking

-- Add updated_at column
ALTER TABLE public.general_info 
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add source field for tracking where the content came from
ALTER TABLE public.general_info 
ADD COLUMN source TEXT;

-- Add parent_id for tracking chunked content relationships
ALTER TABLE public.general_info 
ADD COLUMN parent_id UUID;

-- Add embedding_id to create a direct relationship to the embeddings table
ALTER TABLE public.general_info 
ADD COLUMN embedding_id UUID;

-- Add relevance for sorting content by importance
ALTER TABLE public.general_info 
ADD COLUMN relevance FLOAT DEFAULT 0.5;

-- Add is_chunked to identify content that has been split into smaller pieces
ALTER TABLE public.general_info 
ADD COLUMN is_chunked BOOLEAN DEFAULT false;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_general_info_category ON public.general_info (category);
CREATE INDEX IF NOT EXISTS idx_general_info_parent_id ON public.general_info (parent_id);

-- Update the hybrid_search function to use relevance for result ranking
CREATE OR REPLACE FUNCTION public.hybrid_search(
  query_embedding VECTOR,
  query_text TEXT,
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  content_id UUID,
  content_type TEXT,
  similarity FLOAT,
  content JSONB
)
LANGUAGE plpgsql
AS $$
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
      CASE 
        WHEN g.content ILIKE '%' || query_text || '%' THEN 
          0.7 + (g.relevance / 2) -- Boost by relevance
        ELSE 
          0.6 + (g.relevance / 4) -- Lower boost for partial matches
      END AS text_similarity
    FROM
      general_info g
    WHERE
      g.content ILIKE '%' || query_text || '%'
      OR g.title ILIKE '%' || query_text || '%'
      OR g.category ILIKE '%' || query_text || '%'
    ORDER BY 
      g.relevance DESC, 
      text_similarity DESC
    LIMIT match_count
  ),
  
  -- The rest of the function remains unchanged
  project_search AS (
    SELECT
      p.id AS text_content_id,
      'project'::TEXT AS text_content_type,
      0.7::FLOAT AS text_similarity
    FROM
      projects p
    WHERE
      p.title ILIKE '%' || query_text || '%'
      OR p.description ILIKE '%' || query_text || '%'
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
    -- Project data
    SELECT 
      p.id AS data_content_id,
      'project'::TEXT AS data_content_type,
      jsonb_build_object(
        'name', p.title,
        'slug', p.slug,
        'summary', p.description,
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
        'category', g.category,
        'relevance', g.relevance
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