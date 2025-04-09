import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Enable edge runtime for better performance
export const runtime = 'edge';

/**
 * GET endpoint to retrieve a session ID by session key
 * @param request - The incoming request
 * @returns The session ID if found, or null
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionKey = searchParams.get('sessionKey');
  
  if (!sessionKey) {
    return NextResponse.json({ error: 'Session key is required' }, { status: 400 });
  }
  
  try {
    // Look up the session by key
    const { data, error } = await supabase
      .from('conversation_sessions')
      .select('id')
      .eq('session_key', sessionKey)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching session:', error);
      return NextResponse.json(
        { error: 'Failed to fetch session' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      sessionId: data?.id || null
    });
  } catch (error: any) {
    console.error('Error in session lookup:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 