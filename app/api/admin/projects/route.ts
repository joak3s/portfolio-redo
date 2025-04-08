import { NextRequest, NextResponse } from 'next/server'
import { ProjectCreate, ProjectUpdate } from '@/lib/types'
import { getAdminClient } from '@/lib/supabase-admin'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { updateProjectImages, updateProjectTools, updateProjectTags } from '@/lib/project-helpers'

type ProjectImageInput = {
  url: string
  alt_text?: string
  order_index: number
}

// Helper function to verify admin authentication
async function verifyAdmin() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session) {
      return false
    }
    
    return true
  } catch (error) {
    console.error('Authentication verification error:', error)
    return false
  }
}

// GET /api/admin/projects - Get all projects (admin only)
export async function GET() {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching projects:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform the project data to match the expected format
    const transformedProjects = projects.map(project => {
      return {
        ...project,
        tools: project.project_tools.map(pt => pt.tools),
        tags: project.project_tags.map(pt => pt.tags),
        images: project.project_images
      }
    })

    return NextResponse.json(transformedProjects)
  } catch (error) {
    console.error('Error in GET /api/admin/projects:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST /api/admin/projects - Create a new project (admin only)
export async function POST(request: NextRequest) {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const projectData = await request.json()
    
    // Extract the related data before inserting the project
    const { images, tools, tags, tool_ids, tag_ids, ...project } = projectData
    
    // Ensure featured is an integer
    if (typeof project.featured === 'boolean') {
      project.featured = project.featured ? 1 : 0
    } else if (typeof project.featured === 'string') {
      // Try to parse as integer first
      const parsed = parseInt(project.featured, 10)
      project.featured = !isNaN(parsed) ? parsed : (project.featured === 'true' ? 1 : 0)
    }
    
    const supabaseAdmin = await getAdminClient()
    const { data, error } = await supabaseAdmin
      .from('projects')
      .insert([project])
      .select()
      .single()

    if (error) {
      console.error('Error creating project:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const projectId = data.id

    // Handle related data (images, tools, tags)
    if (images && images.length > 0) {
      await updateProjectImages(projectId, images)
    }

    // Handle tools from either tools or tool_ids (prioritize tool_ids if both are present)
    if (tool_ids && tool_ids.length > 0) {
      await updateProjectTools(projectId, tool_ids)
    } else if (tools && tools.length > 0) {
      const toolIds = tools.map((tool: any) => typeof tool === 'string' ? tool : tool.id)
      await updateProjectTools(projectId, toolIds)
    }

    // Handle tags from either tags or tag_ids (prioritize tag_ids if both are present)
    if (tag_ids && tag_ids.length > 0) {
      await updateProjectTags(projectId, tag_ids)
    } else if (tags && tags.length > 0) {
      const tagIds = tags.map((tag: any) => typeof tag === 'string' ? tag : tag.id)
      await updateProjectTags(projectId, tagIds)
    }

    return NextResponse.json({
      message: 'Project created successfully',
      id: projectId
    })
  } catch (error) {
    console.error('Error in POST /api/admin/projects:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/projects - Update a project (admin only)
export async function PUT(request: NextRequest) {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const projectData = await request.json()
    // Extract tags, tools and images before updating the project
    const { id, images, tools, tags, tool_ids, tag_ids, ...project } = projectData

    if (!id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }
    
    // Ensure featured is an integer
    if (typeof project.featured === 'boolean') {
      project.featured = project.featured ? 1 : 0
    } else if (typeof project.featured === 'string') {
      // Try to parse as integer first
      const parsed = parseInt(project.featured, 10)
      project.featured = !isNaN(parsed) ? parsed : (project.featured === 'true' ? 1 : 0)
    }

    const supabaseAdmin = await getAdminClient()
    const { error } = await supabaseAdmin
      .from('projects')
      .update(project)
      .eq('id', id)

    if (error) {
      console.error('Error updating project:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Handle related data (images, tools, tags)
    if (images) {
      await updateProjectImages(id, images)
    }

    // Handle tools from either tools or tool_ids (prioritize tool_ids if both are present)
    if (tool_ids && tool_ids.length > 0) {
      await updateProjectTools(id, tool_ids)
    } else if (tools && tools.length > 0) {
      const toolIds = tools.map((tool: any) => typeof tool === 'string' ? tool : tool.id)
      await updateProjectTools(id, toolIds)
    }

    // Handle tags from either tags or tag_ids (prioritize tag_ids if both are present)
    if (tag_ids && tag_ids.length > 0) {
      await updateProjectTags(id, tag_ids)
    } else if (tags && tags.length > 0) {
      const tagIds = tags.map((tag: any) => typeof tag === 'string' ? tag : tag.id)
      await updateProjectTags(id, tagIds)
    }

    return NextResponse.json({
      message: 'Project updated successfully',
      id
    })
  } catch (error) {
    console.error('Error in PUT /api/admin/projects:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/projects?id={id} - Delete a project (admin only)
export async function DELETE(request: NextRequest) {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    const supabaseAdmin = await getAdminClient()
    
    // Delete related records first
    // Images
    await supabaseAdmin
      .from('project_images')
      .delete()
      .eq('project_id', id)
    
    // Tools
    await supabaseAdmin
      .from('project_tools')
      .delete()
      .eq('project_id', id)
    
    // Tags
    await supabaseAdmin
      .from('project_tags')
      .delete()
      .eq('project_id', id)
    
    // Finally delete the project
    const { error } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting project:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Project deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/admin/projects:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 