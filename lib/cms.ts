"use server"

import fs from "fs/promises"
import path from "path"
import type { Project } from "./types"

const dataFilePath = path.join(process.cwd(), "data", "projects.json")

// Read all projects
export async function getProjects(): Promise<Project[]> {
  try {
    const data = await fs.readFile(dataFilePath, "utf8")
    return JSON.parse(data) as Project[]
  } catch (error) {
    console.error("Error reading projects:", error)
    return []
  }
}

// Get a single project by slug
export async function getProjectBySlug(slug: string): Promise<Project | null> {
  try {
    const projects = await getProjects()
    return projects.find((project) => project.slug === slug) || null
  } catch (error) {
    console.error("Error getting project by slug:", error)
    return null
  }
}

// Get featured projects
export async function getFeaturedProjects(): Promise<Project[]> {
  try {
    const projects = await getProjects()
    return projects.filter((project) => project.featured_order > 0).sort((a, b) => a.featured_order - b.featured_order)
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
    await fs.writeFile(dataFilePath, JSON.stringify([...projects, newProject], null, 2))

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
    projects[index] = updatedProject

    await fs.writeFile(dataFilePath, JSON.stringify(projects, null, 2))

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

    await fs.writeFile(dataFilePath, JSON.stringify(filteredProjects, null, 2))
  } catch (error) {
    console.error("Error deleting project by slug:", error)
    throw error
  }
}

