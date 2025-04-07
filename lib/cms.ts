"use server"

import { getAdminClient } from './supabase-admin'
import { createServerSupabaseClient } from './supabase-server'
import type { Project } from "./types"

// Read all projects
export async function getProjects(): Promise<Project[]> {
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
      throw error
    }

    // Transform data to match expected format
    const formattedProjects = projects.map(project => {
      return {
        ...project,
        tools: project.project_tools.map((pt: any) => pt.tools),
        tags: project.project_tags.map((pt: any) => pt.tags),
        images: project.project_images
      }
    })

    return formattedProjects
  } catch (error) {
    console.error('Error in getProjects:', error)
    return []
  }
}

// Get a single project by slug
export async function getProjectBySlug(slug: string): Promise<Project | null> {
  try {
    const supabaseAdmin = await getAdminClient()
    const { data: project, error } = await supabaseAdmin
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
      .eq('slug', slug)
      .single()

    if (error) {
      console.error(`Error fetching project with slug ${slug}:`, error)
      return null
    }

    // Transform data to match expected format
    return {
      ...project,
      tools: project.project_tools.map((pt: any) => pt.tools),
      tags: project.project_tags.map((pt: any) => pt.tags),
      images: project.project_images
    }
  } catch (error) {
    console.error(`Error in getProjectBySlug for ${slug}:`, error)
    return null
  }
}

// Get featured projects
export async function getFeaturedProjects(): Promise<Project[]> {
  try {
    const projects = await getProjects()
    return projects.filter(project => project.featured)
  } catch (error) {
    console.error('Error in getFeaturedProjects:', error)
    return []
  }
}

// Create a new project
export async function createProject(projectData: any): Promise<Project> {
  try {
    const supabaseAdmin = await getAdminClient()
    const { data, error } = await supabaseAdmin
      .from('projects')
      .insert([projectData])
      .select()
      .single()

    if (error) {
      console.error('Error creating project:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error in createProject:', error)
    throw error
  }
}

// Update an existing project by slug
export async function updateProjectBySlug(slug: string, projectData: any): Promise<Project> {
  try {
    const supabaseAdmin = await getAdminClient()
    const { data, error } = await supabaseAdmin
      .from('projects')
      .update(projectData)
      .eq('slug', slug)
      .select()
      .single()

    if (error) {
      console.error(`Error updating project with slug ${slug}:`, error)
      throw error
    }

    return data
  } catch (error) {
    console.error(`Error in updateProjectBySlug for ${slug}:`, error)
    throw error
  }
}

// Delete a project by slug
export async function deleteProjectBySlug(slug: string): Promise<void> {
  try {
    const supabaseAdmin = await getAdminClient()
    
    // First get the project ID
    const { data: project, error: fetchError } = await supabaseAdmin
      .from('projects')
      .select('id')
      .eq('slug', slug)
      .single()

    if (fetchError || !project) {
      console.error(`Error fetching project with slug ${slug}:`, fetchError)
      throw fetchError || new Error('Project not found')
    }

    const projectId = project.id

    // Delete project data
    // Delete project images
    await supabaseAdmin
      .from('project_images')
      .delete()
      .eq('project_id', projectId)
    
    // Delete project tools
    await supabaseAdmin
      .from('project_tools')
      .delete()
      .eq('project_id', projectId)
    
    // Delete project tags
    await supabaseAdmin
      .from('project_tags')
      .delete()
      .eq('project_id', projectId)
    
    // Delete the project itself
    const { error } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('id', projectId)

    if (error) {
      console.error(`Error deleting project with slug ${slug}:`, error)
      throw error
    }

    return true
  } catch (error) {
    console.error(`Error in deleteProjectBySlug for ${slug}:`, error)
    throw error
  }
}

