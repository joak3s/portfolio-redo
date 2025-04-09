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
 * GET endpoint to retrieve projects for chat suggestions
 * @param request - The incoming request
 * @returns List of project titles for use in chat quick prompts
 */
export async function GET(request: Request) {
  try {
    // Only select the fields needed for chat suggestions
    const { data, error } = await supabase
      .from('projects')
      .select('id, title, slug')
      .order('featured', { ascending: false })
      .order('title', { ascending: true });
    
    if (error) {
      console.error('Error fetching projects for chat:', error);
      return NextResponse.json(
        { error: 'Failed to fetch projects' },
        { status: 500 }
      );
    }
    
    // Return a simpler format with just the project titles
    return NextResponse.json({
      projects: data?.map(project => project.title) || [],
      lastUpdated: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in chat projects lookup:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 