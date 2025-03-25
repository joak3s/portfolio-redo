import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: projects, error } = await supabaseAdmin
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
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching projects:', error)
      throw error
    }

    // Transform the data to match the Project type
    const transformedProjects = projects.map(project => ({
      ...project,
      tools: project.tools?.map((pt: any) => pt.tool).filter(Boolean) || [],
      tags: project.tags?.map((pt: any) => pt.tag).filter(Boolean) || []
    }))

    return NextResponse.json(transformedProjects)
  } catch (error) {
    console.error('Error in GET /api/projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

