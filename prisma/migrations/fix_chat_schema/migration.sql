-- Fix chat_history table schema
-- Make role and content required, user_prompt and response optional

-- First, ensure all existing records have valid role and content values
UPDATE public.chat_history
SET content = COALESCE(content, user_prompt, response, '')
WHERE content IS NULL;

UPDATE public.chat_history
SET role = COALESCE(role, 
    CASE 
        WHEN user_prompt IS NOT NULL THEN 'user'
        ELSE 'assistant'
    END)
WHERE role IS NULL;

-- Make role and content NOT NULL
ALTER TABLE public.chat_history
ALTER COLUMN role SET NOT NULL,
ALTER COLUMN content SET NOT NULL;

-- Make user_prompt and response nullable
ALTER TABLE public.chat_history
ALTER COLUMN user_prompt DROP NOT NULL,
ALTER COLUMN response DROP NOT NULL;

-- Create a trigger to ensure content is always populated
CREATE OR REPLACE FUNCTION ensure_chat_content_not_null()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.content IS NULL THEN
        NEW.content := COALESCE(NEW.user_prompt, NEW.response, '');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER chat_history_content_trigger
BEFORE INSERT OR UPDATE ON public.chat_history
FOR EACH ROW
EXECUTE FUNCTION ensure_chat_content_not_null();

-- Add comment to explain schema
COMMENT ON TABLE public.chat_history IS 'Stores chat messages with required role/content fields and optional user_prompt/response fields for backward compatibility'; 