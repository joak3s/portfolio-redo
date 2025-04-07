import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'

export async function GET() {
  try {
    const supabaseAdmin = await getAdminClient()
    const { data: projects, error } = await supabaseAdmin
      .from('projects')
      .select(`
        *,
        project_images (*),
        project_tools (
          tool_id,
          tools (*)
        ),
        project_tags (
          tag_id,
          tags (*)
        )
      `)
      .eq('featured', true)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching projects:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform the project data to match the expected format
    const transformedProjects = projects.map(project => {
      return {
        ...project,
        tools: project.project_tools.map((pt: any) => pt.tools),
        tags: project.project_tags.map((pt: any) => pt.tags),
        images: project.project_images
      }
    })

    return NextResponse.json(transformedProjects)
  } catch (error) {
    console.error('Error in GET /api/projects:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

