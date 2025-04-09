import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Get or create a conversation session
export async function getOrCreateSession(sessionKey: string): Promise<string> {
  try {
    // Check if session exists
    const { data: existingSession, error: lookupError } = await supabase
      .from('conversation_sessions')
      .select('id')
      .eq('session_key', sessionKey)
      .maybeSingle();
    
    if (lookupError) {
      console.error('Error checking for session:', lookupError);
      throw lookupError;
    }
    
    // If session exists, return its ID
    if (existingSession) {
      return existingSession.id;
    }
    
    // Create new session with provided key
    const { data: newSession, error: insertError } = await supabase
      .from('conversation_sessions')
      .insert({
        session_key: sessionKey,
        title: 'New Chat' // Default title
      })
      .select('id')
      .single();
    
    if (insertError || !newSession) {
      console.error('Error creating session:', insertError);
      throw insertError || new Error('Failed to create session');
    }
    
    return newSession.id;
  } catch (error) {
    console.error('Session error:', error);
    throw error;
  }
}

// Save chat message to history
export async function saveChatMessage(
  sessionId: string | null, 
  role: 'user' | 'assistant', 
  content: string
): Promise<string | null> {
  if (!sessionId) return null;
  
  try {
    // With the updated schema, role and content are required fields
    // while user_prompt and response are optional
    const messageData: any = {
      session_id: sessionId,
      role: role,
      content: content,
    };
    
    // Also populate the old schema fields for backward compatibility
    if (role === 'user') {
      messageData.user_prompt = content;
      messageData.response = null;
    } else {
      messageData.user_prompt = null;
      messageData.response = content;
    }
    
    const { data: message, error } = await supabase
      .from('chat_history')
      .insert(messageData)
      .select('id')
      .single();
    
    if (error) {
      console.error('Error saving chat message:', error);
      throw error;
    }
    
    return message?.id || null;
  } catch (error) {
    console.error('Error saving message:', error);
    throw error;
  }
}

// Get previous messages from a session
export async function getSessionMessages(sessionId: string, limit = 10): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('chat_history')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(limit);
    
    if (error) {
      console.error('Error getting session messages:', error);
      throw error;
    }
    
    // If project images are stored, add them to the response data
    // This is a custom field that might be added in a future migration
    const messagesWithImages = await Promise.all(data.map(async (msg) => {
      // Only check for project images in assistant messages
      if (msg.role === 'assistant' || (!msg.role && msg.response)) {
        // Check if this message has an associated project
        const { data: projectImageData, error: projectError } = await supabase
          .from('chat_projects')
          .select('project_id, project_image')
          .eq('message_id', msg.id)
          .maybeSingle();
        
        if (!projectError && projectImageData?.project_image) {
          return { ...msg, project_image: projectImageData.project_image };
        }
      }
      return msg;
    }));
    
    return messagesWithImages || [];
  } catch (error) {
    console.error('Error getting messages:', error);
    throw error;
  }
}

// Update session title
export async function updateSessionTitle(
  sessionId: string | null, 
  title: string
): Promise<void> {
  if (!sessionId) return;
  
  const { error } = await supabase
    .from('conversation_sessions')
    .update({ 
      title,
      updated_at: new Date().toISOString()
    })
    .eq('id', sessionId);
  
  if (error) {
    console.error('Error updating session title:', error);
    throw error;
  }
}

// Get all sessions
export async function getSessionsList(limit = 10): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('conversation_sessions')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error getting sessions list:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error getting sessions:', error);
    throw error;
  }
} 