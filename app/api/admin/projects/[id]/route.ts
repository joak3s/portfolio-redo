import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { Project } from '@/lib/types'
import { ProjectUpdate } from '@/lib/types'
import {
  updateProjectImages,
  updateProjectTools,
  updateProjectTags,
} from '@/lib/project-helpers'
import { getAdminClient } from '@/lib/supabase-admin'

const dataFilePath = path.join(process.cwd(), 'public', 'data', 'projects.json')
const projectsDirectory = path.join(process.cwd(), 'public', 'projects')

async function getProjects(): Promise<Project[]> {
  try {
    const data = await fs.readFile(dataFilePath, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    return []
  }
}

async function saveProjects(projects: Project[]): Promise<void> {
  await fs.mkdir(path.dirname(dataFilePath), { recursive: true })
  await fs.writeFile(dataFilePath, JSON.stringify(projects, null, 2))
}

// Get a single project by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseAdmin = await getAdminClient();
    
    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .select(`
        *,
        project_images (*),
        project_tools (
          tool:tools (*)
        ),
        project_tags (
          tag:tags (*)
        )
      `)
      .eq('id', params.id)
      .single()
    
    if (error || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Transform the data to match the Project type
    const transformedProject = {
      ...project,
      tools: project.project_tools?.map((pt: any) => pt.tool).filter(Boolean) || [],
      tags: project.project_tags?.map((pt: any) => pt.tag).filter(Boolean) || []
    }

    return NextResponse.json(transformedProject)
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 })
  }
}

// Update a project
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseAdmin = await getAdminClient();
    
    console.log('Updating project:', params.id)
    const body: ProjectUpdate = await request.json()
    const { images, tool_ids, tag_ids, ...updateData } = body

    // Update the project
    const { error: projectError } = await supabaseAdmin
      .from('projects')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)

    if (projectError) {
      console.error('Error updating project:', projectError)
      throw projectError
    }

    // Update images if provided
    if (images !== undefined) {
      console.log('Updating project images')
      // Delete existing images
      const { error: deleteImagesError } = await supabaseAdmin
        .from('project_images')
        .delete()
        .eq('project_id', params.id)

      if (deleteImagesError) {
        console.error('Error deleting images:', deleteImagesError)
        throw deleteImagesError
      }

      // Insert new images
      if (images.length > 0) {
        const { error: imagesError } = await supabaseAdmin
          .from('project_images')
          .insert(
            images.map((image) => ({
              project_id: params.id,
              url: image.url,
              alt_text: image.alt_text,
              order_index: image.order_index
            }))
          )

        if (imagesError) {
          console.error('Error inserting images:', imagesError)
          throw imagesError
        }
      }
    }

    // Update tools if provided
    if (tool_ids !== undefined) {
      console.log('Updating project tools')
      // Delete existing tools
      const { error: deleteToolsError } = await supabaseAdmin
        .from('project_tools')
        .delete()
        .eq('project_id', params.id)

      if (deleteToolsError) {
        console.error('Error deleting tools:', deleteToolsError)
        throw deleteToolsError
      }

      // Insert new tools
      if (tool_ids.length > 0) {
        const { error: toolsError } = await supabaseAdmin
          .from('project_tools')
          .insert(
            tool_ids.map((toolId) => ({
              project_id: params.id,
              tool_id: toolId
            }))
          )

        if (toolsError) {
          console.error('Error inserting tools:', toolsError)
          throw toolsError
        }
      }
    }

    // Update tags if provided
    if (tag_ids !== undefined) {
      console.log('Updating project tags')
      // Delete existing tags
      const { error: deleteTagsError } = await supabaseAdmin
        .from('project_tags')
        .delete()
        .eq('project_id', params.id)

      if (deleteTagsError) {
        console.error('Error deleting tags:', deleteTagsError)
        throw deleteTagsError
      }

      // Insert new tags
      if (tag_ids.length > 0) {
        const { error: tagsError } = await supabaseAdmin
          .from('project_tags')
          .insert(
            tag_ids.map((tagId) => ({
              project_id: params.id,
              tag_id: tagId
            }))
          )

        if (tagsError) {
          console.error('Error inserting tags:', tagsError)
          throw tagsError
        }
      }
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
      .eq('id', params.id)
      .single()

    if (fetchError) {
      console.error('Error fetching updated project:', fetchError)
      throw fetchError
    }

    // Transform the data to match the Project type
    const transformedProject = {
      ...updatedProject,
      tools: updatedProject.tools?.map((pt: any) => pt.tool).filter(Boolean) || [],
      tags: updatedProject.tags?.map((pt: any) => pt.tag).filter(Boolean) || []
    }

    return NextResponse.json(transformedProject)
  } catch (error) {
    console.error('Error in PUT /api/admin/projects/[id]:', error)
    return NextResponse.json(
      { error: 'Failed to update project', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Delete a project
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseAdmin = await getAdminClient();
    
    console.log('Deleting project:', params.id)
    
    // Delete project (cascade will handle related records)
    const { error } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting project:', error)
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/admin/projects/[id]:', error)
    return NextResponse.json(
      { error: 'Failed to delete project', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 