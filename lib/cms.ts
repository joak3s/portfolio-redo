"use server"

import { supabaseAdmin } from "@/lib/supabase-admin"
import type { Project } from "./types"

// Read all projects
export async function getProjects(): Promise<Project[]> {
  try {
    const { data: projects, error } = await supabaseAdmin
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
      .order('created_at', { ascending: false })

    if (error) {
      console.error("Error reading projects:", error)
      return []
    }

    return projects.map(project => ({
      ...project,
      tools: project.project_tools?.map((pt: any) => pt.tool).filter(Boolean) || [],
      tags: project.project_tags?.map((pt: any) => pt.tag).filter(Boolean) || []
    }))
  } catch (error) {
    console.error("Error reading projects:", error)
    return []
  }
}

// Get a single project by slug
export async function getProjectBySlug(slug: string): Promise<Project | null> {
  try {
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
      .eq('slug', slug)
      .single()

    if (error || !project) {
      console.error("Error getting project by slug:", error)
      return null
    }

    return {
      ...project,
      tools: project.project_tools?.map((pt: any) => pt.tool).filter(Boolean) || [],
      tags: project.project_tags?.map((pt: any) => pt.tag).filter(Boolean) || []
    }
  } catch (error) {
    console.error("Error getting project by slug:", error)
    return null
  }
}

// Get featured projects
export async function getFeaturedProjects(): Promise<Project[]> {
  try {
    const { data: projects, error } = await supabaseAdmin
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
      .gt('featured_order', 0)
      .order('featured_order', { ascending: true })

    if (error) {
      console.error("Error getting featured projects:", error)
      return []
    }

    return projects.map(project => ({
      ...project,
      tools: project.project_tools?.map((pt: any) => pt.tool).filter(Boolean) || [],
      tags: project.project_tags?.map((pt: any) => pt.tag).filter(Boolean) || []
    }))
  } catch (error) {
    console.error("Error getting featured projects:", error)
    return []
  }
}

// Create a new project
export async function createProject(project: Omit<Project, "id">): Promise<Project> {
  try {
    const projects = await getProjects()
    const newId = projects.length > 0 ? Math.max(...projects.map((p) => p.id)) + 1 : 1

    // Check if slug already exists
    if (projects.some((p) => p.slug === project.slug)) {
      throw new Error(`Project with slug "${project.slug}" already exists`)
    }

    const newProject = { ...project, id: newId }
    await supabaseAdmin.from('projects').insert([newProject])

    return newProject
  } catch (error) {
    console.error("Error creating project:", error)
    throw error
  }
}

// Update an existing project by slug
export async function updateProjectBySlug(slug: string, project: Partial<Project>): Promise<Project> {
  try {
    const projects = await getProjects()
    const index = projects.findIndex((p) => p.slug === slug)

    if (index === -1) {
      throw new Error(`Project with slug ${slug} not found`)
    }

    // Check if new slug already exists (if slug is being changed)
    if (project.slug && project.slug !== slug && projects.some((p) => p.slug === project.slug)) {
      throw new Error(`Project with slug "${project.slug}" already exists`)
    }

    const updatedProject = { ...projects[index], ...project }
    await supabaseAdmin.from('projects').update(updatedProject).eq('slug', slug)

    return updatedProject
  } catch (error) {
    console.error("Error updating project by slug:", error)
    throw error
  }
}

// Delete a project by slug
export async function deleteProjectBySlug(slug: string): Promise<void> {
  try {
    const projects = await getProjects()
    const filteredProjects = projects.filter((p) => p.slug !== slug)

    if (filteredProjects.length === projects.length) {
      throw new Error(`Project with slug ${slug} not found`)
    }

    await supabaseAdmin.from('projects').delete().eq('slug', slug)
  } catch (error) {
    console.error("Error deleting project by slug:", error)
    throw error
  }
}

