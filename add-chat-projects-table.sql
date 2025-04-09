-- Create a table to associate chat messages with projects
CREATE TABLE IF NOT EXISTS chat_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES chat_history(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  project_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure we don't have duplicate associations
  CONSTRAINT unique_message_project UNIQUE (message_id, project_id)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_chat_projects_message_id ON chat_projects(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_projects_project_id ON chat_projects(project_id);

-- Add function to save project association when a chat message references a project
CREATE OR REPLACE FUNCTION save_chat_project(
  p_message_id UUID, 
  p_project_id UUID, 
  p_project_image TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  result_id UUID;
BEGIN
  -- Insert association or update if exists
  INSERT INTO chat_projects (message_id, project_id, project_image)
  VALUES (p_message_id, p_project_id, p_project_image)
  ON CONFLICT (message_id, project_id) 
  DO UPDATE SET 
    project_image = p_project_image,
    created_at = NOW()
  RETURNING id INTO result_id;
  
  RETURN result_id;
END;
$$;

-- Add comment for documentation
COMMENT ON TABLE chat_projects IS 'Stores associations between chat messages and projects, including project images used in responses'; 