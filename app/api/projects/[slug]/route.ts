import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import type { Project, Tool, Tag, ProjectImage } from "@/lib/types"

interface ProjectWithRelations extends Project {
  project_images: ProjectImage[]
  project_tools: {
    tool: Tool
  }[]
  project_tags: {
    tag: Tag
  }[]
}

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .select(`
        *,
        project_images (
          id,
          project_id,
          url,
          alt_text,
          order_index,
          created_at
        ),
        project_tools (
          tool:tools (
            id,
            name,
            created_at
          )
        ),
        project_tags (
          tag:tags (
            id,
            name,
            created_at
          )
        )
      `)
      .eq('slug', params.slug)
      .eq('status', 'published')
      .single()

    if (error) {
      console.error('Error fetching project:', error)
      return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 })
    }

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Transform the data to match our expected format
    const transformedProject = {
      ...project,
      project_images: project.project_images || [],
      tools: project.project_tools?.map((pt: { tool: Tool }) => pt.tool) || [],
      tags: project.project_tags?.map((pt: { tag: Tag }) => pt.tag) || []
    }

    return NextResponse.json(transformedProject)
  } catch (error) {
    console.error('Error in GET /api/projects/[slug]:', error)
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const body = await request.json()
    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .update(body)
      .eq('slug', params.slug)
      .select()
      .single()

    if (error) {
      console.error('Error updating project:', error)
      return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error in PUT /api/projects/[slug]:', error)
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { error } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('slug', params.slug)

    if (error) {
      console.error('Error deleting project:', error)
      return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/projects/[slug]:', error)
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
  }
}

