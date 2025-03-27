import { NextRequest, NextResponse } from 'next/server'
import { ProjectCreate, ProjectUpdate } from '@/lib/types'
import { supabaseAdmin } from '@/lib/supabase-admin'
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
    // Create a supabase client using our standardized SSR implementation
    const supabase = await createServerSupabaseClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Authentication error:', error)
      return false
    }
    
    if (!session) {
      console.error('No active session')
      return false
    }
    
    // You could add additional role checks here if needed
    return true
  } catch (error) {
    console.error('Authentication verification error:', error)
    return false
  }
}

// Get all projects (admin view - includes drafts)
export async function GET() {
  try {
    // Verify the request is from an authenticated admin
    const isAdmin = await verifyAdmin()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    if (!projects) {
      console.log('No projects found in database')
      return NextResponse.json([])
    }

    const transformedProjects = projects.map(project => ({
      ...project,
      tools: project.tools?.map((pt: any) => pt.tool).filter(Boolean) || [],
      tags: project.tags?.map((pt: any) => pt.tag).filter(Boolean) || []
    }))

    return NextResponse.json(transformedProjects)
  } catch (error) {
    console.error('Error in GET /api/admin/projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Create a new project
export async function POST(req: NextRequest) {
  try {
    // Verify the request is from an authenticated admin
    const isAdmin = await verifyAdmin()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Safely parse the request body
    let body: ProjectCreate
    try {
      body = await req.json()
      console.log('Received data for new project')
    } catch (parseError) {
      console.error('Error parsing request body:', parseError)
      return NextResponse.json({ 
        error: 'Invalid request body', 
        details: 'Could not parse JSON data' 
      }, { status: 400 })
    }
    
    const { images, tool_ids, tag_ids, ...projectData } = body
    
    // Insert the base project data
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .insert({
        title: projectData.title,
        description: projectData.description,
        slug: projectData.slug,
        challenge: projectData.challenge,
        approach: projectData.approach,
        solution: projectData.solution,
        results: projectData.results,
        website_url: projectData.website_url,
        featured: projectData.featured,
        status: projectData.status || 'draft',
        priority: projectData.priority
      })
      .select()
      .single()

    if (projectError) {
      console.error('Error creating project:', projectError)
      return NextResponse.json({ 
        error: 'Failed to create project', 
        details: projectError.message 
      }, { status: 500 })
    }

    // Handle related data
    try {
      if (images && images.length > 0) {
        await updateProjectImages(project.id, images)
      }
      
      if (tool_ids && tool_ids.length > 0) {
        await updateProjectTools(project.id, tool_ids)
      }
      
      if (tag_ids && tag_ids.length > 0) {
        await updateProjectTags(project.id, tag_ids)
      }
    } catch (relationError) {
      console.error('Error adding related data:', relationError)
      return NextResponse.json({ 
        error: 'Project was created but failed to add relationships', 
        details: relationError instanceof Error ? relationError.message : 'Unknown error'
      }, { status: 500 })
    }

    // Fetch the complete project with relations
    const { data: completeProject, error: fetchError } = await supabaseAdmin
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
      .eq('id', project.id)
      .single()

    if (fetchError) {
      console.error('Error fetching complete project:', fetchError)
      return NextResponse.json({ 
        error: 'Project was created but could not fetch the complete data', 
        details: fetchError.message 
      }, { status: 500 })
    }

    const transformedProject = {
      ...completeProject,
      tools: completeProject.tools?.map((pt: any) => pt.tool).filter(Boolean) || [],
      tags: completeProject.tags?.map((pt: any) => pt.tag).filter(Boolean) || []
    }

    return NextResponse.json(transformedProject)
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Failed to create project', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Update an existing project
export async function PUT(req: NextRequest) {
  try {
    // Verify the request is from an authenticated admin
    const isAdmin = await verifyAdmin()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    // Safely parse the request body
    let body: ProjectUpdate
    try {
      body = await req.json()
      console.log('Received update data for project:', id)
    } catch (parseError) {
      console.error('Error parsing request body:', parseError)
      return NextResponse.json({ 
        error: 'Invalid request body', 
        details: 'Could not parse JSON data' 
      }, { status: 400 })
    }
    
    const { images, tool_ids, tag_ids, ...updateData } = body

    // First, verify the project exists
    const { data: existingProject, error: checkError } = await supabaseAdmin
      .from('projects')
      .select('id')
      .eq('id', id)
      .single()
      
    if (checkError || !existingProject) {
      console.error('Project not found:', id)
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    
    // Update the project basic data
    const { error: projectError } = await supabaseAdmin
      .from('projects')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (projectError) {
      console.error('Error updating project:', projectError)
      return NextResponse.json({ 
        error: 'Failed to update project data', 
        details: projectError.message 
      }, { status: 500 })
    }

    // Handle related data updates
    try {
      if (images !== undefined) {
        await updateProjectImages(id, images)
      }
      
      if (tool_ids !== undefined) {
        await updateProjectTools(id, tool_ids)
      }
      
      if (tag_ids !== undefined) {
        await updateProjectTags(id, tag_ids)
      }
    } catch (relationError) {
      console.error('Error updating related data:', relationError)
      return NextResponse.json({ 
        error: 'Failed to update project relationships', 
        details: relationError instanceof Error ? relationError.message : 'Unknown error'
      }, { status: 500 })
    }

    // Fetch the updated project with all relations
    const { data: updatedProject, error: fetchError } = await supabaseAdmin
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
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('Error fetching updated project:', fetchError)
      return NextResponse.json({ 
        error: 'Project was updated but could not fetch the updated data', 
        details: fetchError.message 
      }, { status: 500 })
    }

    const transformedProject = {
      ...updatedProject,
      tools: updatedProject.tools?.map((pt: any) => pt.tool).filter(Boolean) || [],
      tags: updatedProject.tags?.map((pt: any) => pt.tag).filter(Boolean) || []
    }

    return NextResponse.json(transformedProject)
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json(
      { error: 'Failed to update project', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Delete a project
export async function DELETE(req: NextRequest) {
  try {
    // Verify the request is from an authenticated admin
    const isAdmin = await verifyAdmin()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    // First check if the project exists
    const { data: existingProject, error: checkError } = await supabaseAdmin
      .from('projects')
      .select('id')
      .eq('id', id)
      .single()
      
    if (checkError || !existingProject) {
      console.error('Project not found:', id)
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    
    // Delete related data first (due to foreign key constraints)
    try {
      // Delete project images
      const { error: imagesError } = await supabaseAdmin
        .from('project_images')
        .delete()
        .eq('project_id', id)
      
      if (imagesError) {
        console.error('Error deleting project images:', imagesError)
        throw imagesError
      }
      
      // Delete project tools
      const { error: toolsError } = await supabaseAdmin
        .from('project_tools')
        .delete()
        .eq('project_id', id)
      
      if (toolsError) {
        console.error('Error deleting project tools:', toolsError)
        throw toolsError
      }
      
      // Delete project tags
      const { error: tagsError } = await supabaseAdmin
        .from('project_tags')
        .delete()
        .eq('project_id', id)
      
      if (tagsError) {
        console.error('Error deleting project tags:', tagsError)
        throw tagsError
      }
    } catch (relationError) {
      console.error('Error deleting related data:', relationError)
      return NextResponse.json({ 
        error: 'Failed to delete project relationships', 
        details: relationError instanceof Error ? relationError.message : 'Unknown error'
      }, { status: 500 })
    }
    
    // Now delete the project itself
    const { error: deleteError } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('id', id)
    
    if (deleteError) {
      console.error('Error deleting project:', deleteError)
      return NextResponse.json({ 
        error: 'Failed to delete project', 
        details: deleteError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Project deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { error: 'Failed to delete project', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 