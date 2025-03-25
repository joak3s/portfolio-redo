import { NextResponse } from 'next/server'
import { ProjectCreate, ProjectUpdate } from '@/lib/types'
import { supabaseAdmin } from '@/lib/supabase-admin'

type ProjectImageInput = {
  url: string
  alt_text?: string
  order_index: number
}

// List all projects (admin view with all data)
export async function GET() {
  try {
    console.log('Fetching projects from Supabase...')
    
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

    if (error) throw error

    if (!projects) {
      console.log('No projects found in database')
      return NextResponse.json([])
    }

    console.log(`Found ${projects.length} projects`)

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
export async function POST(request: Request) {
  try {
    const body: ProjectCreate = await request.json()
    
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .insert({
        title: body.title,
        description: body.description,
        slug: body.slug,
        challenge: body.challenge,
        approach: body.approach,
        solution: body.solution,
        results: body.results,
        website_url: body.website_url,
        featured: body.featured,
        status: body.status || 'draft',
        priority: body.priority
      })
      .select()
      .single()

    if (projectError) throw projectError

    // Insert project images
    if (body.images && body.images.length > 0) {
      const { error: imagesError } = await supabaseAdmin
        .from('project_images')
        .insert(
          body.images.map(image => ({
            project_id: project.id,
            url: image.url,
            alt_text: image.alt_text,
            order_index: image.order_index
          }))
        )

      if (imagesError) throw imagesError
    }

    // Insert tool relationships
    if (body.tool_ids && body.tool_ids.length > 0) {
      const { error: toolsError } = await supabaseAdmin
        .from('project_tools')
        .insert(
          body.tool_ids.map(toolId => ({
            project_id: project.id,
            tool_id: toolId
          }))
        )

      if (toolsError) throw toolsError
    }

    // Insert tag relationships
    if (body.tag_ids && body.tag_ids.length > 0) {
      const { error: tagsError } = await supabaseAdmin
        .from('project_tags')
        .insert(
          body.tag_ids.map(tagId => ({
            project_id: project.id,
            tag_id: tagId
          }))
        )

      if (tagsError) throw tagsError
    }

    // Fetch the complete project
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

    if (fetchError) throw fetchError

    const transformedProject = {
      ...completeProject,
      tools: completeProject.tools?.map((pt: any) => pt.tool).filter(Boolean) || [],
      tags: completeProject.tags?.map((pt: any) => pt.tag).filter(Boolean) || []
    }

    return NextResponse.json(transformedProject)
  } catch (error) {
    console.error('Error in POST /api/admin/projects:', error)
    return NextResponse.json(
      { error: 'Failed to create project', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Update a project
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    const body: ProjectUpdate = await request.json()
    const { images, tool_ids, tag_ids, ...updateData } = body

    // Update the project
    const { error: projectError } = await supabaseAdmin
      .from('projects')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (projectError) throw projectError

    // Update images if provided
    if (images !== undefined) {
      // Delete existing images
      const { error: deleteImagesError } = await supabaseAdmin
        .from('project_images')
        .delete()
        .eq('project_id', id)

      if (deleteImagesError) throw deleteImagesError

      // Insert new images
      if (images.length > 0) {
        const { error: imagesError } = await supabaseAdmin
          .from('project_images')
          .insert(
            images.map(image => ({
              project_id: id,
              url: image.url,
              alt_text: image.alt_text || '',
              order_index: image.order_index
            }))
          )

        if (imagesError) throw imagesError
      }
    }

    // Update tools if provided
    if (tool_ids !== undefined) {
      // Delete existing tools
      const { error: deleteToolsError } = await supabaseAdmin
        .from('project_tools')
        .delete()
        .eq('project_id', id)

      if (deleteToolsError) throw deleteToolsError

      // Insert new tools
      if (tool_ids.length > 0) {
        const { error: toolsError } = await supabaseAdmin
          .from('project_tools')
          .insert(
            tool_ids.map(toolId => ({
              project_id: id,
              tool_id: toolId
            }))
          )

        if (toolsError) throw toolsError
      }
    }

    // Update tags if provided
    if (tag_ids !== undefined) {
      // Delete existing tags
      const { error: deleteTagsError } = await supabaseAdmin
        .from('project_tags')
        .delete()
        .eq('project_id', id)

      if (deleteTagsError) throw deleteTagsError

      // Insert new tags
      if (tag_ids.length > 0) {
        const { error: tagsError } = await supabaseAdmin
          .from('project_tags')
          .insert(
            tag_ids.map(tagId => ({
              project_id: id,
              tag_id: tagId
            }))
          )

        if (tagsError) throw tagsError
      }
    }

    // Fetch the updated project
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

    if (fetchError) throw fetchError

    const transformedProject = {
      ...updatedProject,
      tools: updatedProject.tools?.map((pt: any) => pt.tool).filter(Boolean) || [],
      tags: updatedProject.tags?.map((pt: any) => pt.tag).filter(Boolean) || []
    }

    return NextResponse.json(transformedProject)
  } catch (error) {
    console.error('Error in PUT /api/admin/projects:', error)
    return NextResponse.json(
      { error: 'Failed to update project', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Delete a project
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/admin/projects:', error)
    return NextResponse.json(
      { error: 'Failed to delete project', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 