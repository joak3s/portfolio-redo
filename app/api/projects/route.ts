import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  try {
    // Add retry logic directly in the route
    let attempts = 0;
    const maxAttempts = 3;
    let projects = null;
    let error = null;
    
    while (attempts < maxAttempts) {
      attempts++;
      
      try {
        const result = await supabaseAdmin
          .from('projects')
          .select(`
            *,
            project_images (*),
            tools:project_tools (
              tool:tools (*)
            ),
            tags:project_tags (
              tag:tags (*)
            )
          `)
          .order('featured', { ascending: true, nullsFirst: false })
          .order('created_at', { ascending: false });
        
        projects = result.data;
        error = result.error;
        
        // Break the loop if successful
        if (!error) break;
        
        console.warn(`Query attempt ${attempts}/${maxAttempts} failed:`, error);
        
        // Wait before retrying (exponential backoff)
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      } catch (err) {
        error = err;
        console.warn(`Query attempt ${attempts}/${maxAttempts} failed with exception:`, err);
        
        // Wait before retrying
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      }
    }

    if (error) {
      console.error('Error fetching projects after all retries:', error);
      throw error;
    }

    if (!projects || projects.length === 0) {
      // Return empty array with 200 status if no projects found
      return NextResponse.json([]);
    }

    // Transform the data to match the Project type
    const transformedProjects = projects.map((project) => ({
      ...project,
      tools: project.tools?.map((pt) => pt.tool).filter(Boolean) || [],
      tags: project.tags?.map((pt) => pt.tag).filter(Boolean) || []
    }));

    return NextResponse.json(transformedProjects);
  } catch (error) {
    console.error('Error in GET /api/projects:', error);
    
    // Provide more specific error details in development
    const errorDetails = process.env.NODE_ENV === 'development' 
      ? { message: error instanceof Error ? error.message : 'Unknown error', stack: error instanceof Error ? error.stack : undefined }
      : { message: 'An error occurred while fetching projects' };
    
    return NextResponse.json(
      { error: 'Failed to fetch projects', details: errorDetails },
      { status: 500 }
    );
  }
}

