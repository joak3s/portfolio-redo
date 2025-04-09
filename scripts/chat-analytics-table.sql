-- Create chat_analytics table for tracking chat interactions
CREATE TABLE IF NOT EXISTS chat_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query TEXT NOT NULL,
  response TEXT NOT NULL,
  session_id UUID NULL REFERENCES conversation_sessions(id) ON DELETE SET NULL,
  user_id UUID NULL,
  search_results JSONB NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB NULL
);

-- Create indices for better query performance
CREATE INDEX IF NOT EXISTS idx_chat_analytics_session_id ON chat_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_analytics_created_at ON chat_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_analytics_user_id ON chat_analytics(user_id);

-- Add a function to check for common queries
CREATE OR REPLACE FUNCTION find_similar_queries(
  query_text TEXT,
  similarity_threshold FLOAT DEFAULT 0.8,
  max_results INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  query TEXT,
  response TEXT,
  similarity FLOAT
)
LANGUAGE SQL
AS $$
  SELECT 
    ca.id,
    ca.query,
    ca.response,
    similarity(ca.query, query_text) as similarity
  FROM 
    chat_analytics ca
  WHERE 
    similarity(ca.query, query_text) > similarity_threshold
  ORDER BY 
    similarity DESC
  LIMIT 
    max_results;
$$;

-- Add a comment explaining the function
COMMENT ON FUNCTION find_similar_queries IS 
'Finds similar queries in the chat_analytics table using text similarity.
Parameters:
- query_text: The query to find similar matches for
- similarity_threshold: Minimum similarity score (0.0 to 1.0)
- max_results: Maximum number of results to return';

-- Example usage:
-- SELECT * FROM find_similar_queries('What projects have you worked on?', 0.7, 3); 