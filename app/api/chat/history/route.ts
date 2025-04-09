import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSessionMessages } from '@/lib/chat-db';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Enable edge runtime for better performance
export const runtime = 'edge';

/**
 * GET endpoint to retrieve chat history by session ID
 * @param request - The incoming request
 * @returns The chat messages for the requested session
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 50;
  
  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
  }
  
  try {
    // Fetch chat messages for the session
    const rawMessages = await getSessionMessages(sessionId, limit);
    
    // Format messages to work with both old and new schema
    const messages = rawMessages.map(msg => ({
      id: msg.id,
      // Support both new and old schema
      role: msg.role || (msg.user_prompt ? 'user' : 'assistant'),
      content: msg.content || (msg.role === 'user' ? msg.user_prompt : msg.response),
      user_prompt: msg.user_prompt,
      response: msg.response,
      created_at: msg.created_at
    }));
    
    return NextResponse.json({
      messages,
      count: messages.length
    });
  } catch (error: any) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch chat history' },
      { status: 500 }
    );
  }
} 