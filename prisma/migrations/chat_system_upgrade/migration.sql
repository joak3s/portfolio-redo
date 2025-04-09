-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Step 1: Create a backup of the existing data
CREATE TABLE IF NOT EXISTS public._chat_history_backup AS 
SELECT * FROM public.chat_history;

CREATE TABLE IF NOT EXISTS public._conversation_sessions_backup AS 
SELECT * FROM public.conversation_sessions;

-- Step 2: Add session_key column to conversation_sessions if it doesn't exist
ALTER TABLE public.conversation_sessions 
ADD COLUMN IF NOT EXISTS session_key TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS user_id UUID,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create indexes on conversation_sessions
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_key ON public.conversation_sessions(session_key);
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_updated_at ON public.conversation_sessions(updated_at);

-- Step 3: Modify the chat_history table
-- Add new columns and drop old ones in a way that preserves data
ALTER TABLE public.chat_history 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'assistant' NOT NULL,
ADD COLUMN IF NOT EXISTS content TEXT NOT NULL;

-- Update the user_prompt and response columns to be optional
ALTER TABLE public.chat_history
ALTER COLUMN user_prompt DROP NOT NULL,
ALTER COLUMN response DROP NOT NULL;

-- Create indexes on chat_history
CREATE INDEX IF NOT EXISTS idx_chat_history_session_id ON public.chat_history(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON public.chat_history(created_at);

-- Migrate data where possible (assuming user_prompt can become content where role='user')
UPDATE public.chat_history
SET role = 'user', content = user_prompt
WHERE user_prompt IS NOT NULL AND content IS NULL;

-- Migrate response data
UPDATE public.chat_history
SET role = 'assistant', content = response
WHERE response IS NOT NULL AND content IS NULL AND role = 'assistant';

-- Step 4: Create the chat_analytics table
CREATE TABLE IF NOT EXISTS public.chat_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query TEXT NOT NULL,
  response TEXT NOT NULL,
  session_id UUID REFERENCES public.conversation_sessions(id) ON DELETE SET NULL,
  user_id UUID,
  search_results JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

-- Create indexes for chat_analytics
CREATE INDEX IF NOT EXISTS idx_chat_analytics_session_id ON public.chat_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_analytics_created_at ON public.chat_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_analytics_user_id ON public.chat_analytics(user_id);

-- Step 5: Create function to find similar queries
CREATE OR REPLACE FUNCTION public.find_similar_queries(
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
    public.chat_analytics ca
  WHERE 
    similarity(ca.query, query_text) > similarity_threshold
  ORDER BY 
    similarity DESC
  LIMIT 
    max_results;
$$;

-- Add comment to the function
COMMENT ON FUNCTION public.find_similar_queries IS 
'Finds similar queries in the chat_analytics table using text similarity.
Parameters:
- query_text: The query to find similar matches for
- similarity_threshold: Minimum similarity score (0.0 to 1.0)
- max_results: Maximum number of results to return';

-- Step 6: After verification, you can drop columns that are no longer needed
-- ALTER TABLE public.chat_history 
-- DROP COLUMN IF EXISTS user_prompt,
-- DROP COLUMN IF EXISTS response,
-- DROP COLUMN IF EXISTS messages,
-- DROP COLUMN IF EXISTS system_instructions,
-- DROP COLUMN IF EXISTS model,
-- DROP COLUMN IF EXISTS context_used,
-- DROP COLUMN IF EXISTS feedback,
-- DROP COLUMN IF EXISTS completion_tokens,
-- DROP COLUMN IF EXISTS total_tokens;

-- ALTER TABLE public.conversation_sessions
-- DROP COLUMN IF EXISTS summary,
-- DROP COLUMN IF EXISTS messages,
-- DROP COLUMN IF EXISTS last_updated; 