import { getProjectBySlug, updateProjectBySlug, deleteProjectBySlug } from "@/lib/cms"
import { NextResponse } from "next/server"
import { promises as fs } from 'fs'
import path from 'path'
import { Project } from '@/lib/types'

const dataFilePath = path.join(process.cwd(), 'data', 'projects.json')

async function getProjects(): Promise<Project[]> {
  const data = await fs.readFile(dataFilePath, 'utf8')
  return JSON.parse(data)
}

// Get a single project by slug (public view)
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = await Promise.resolve(params.slug)
    const projects = await getProjects()
    const project = projects.find(p => p.slug === slug && p.status === 'published')

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Return a filtered version for public consumption
    const publicProject = {
      id: project.id,
      title: project.title,
      slug: project.slug,
      description: project.description,
      content: project.content,
      images: project.images,
      tags: project.tags,
      tools: project.tools,
      publishedAt: project.publishedAt
    }

    return NextResponse.json(publicProject)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { slug: string } }) {
  try {
    const body = await request.json()
    const existingProject = await getProjectBySlug(params.slug)

    if (!existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const updatedProject = await updateProjectBySlug(params.slug, body)
    return NextResponse.json(updatedProject)
  } catch (error) {
    console.error("Error updating project:", error)
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { slug: string } }) {
  try {
    const existingProject = await getProjectBySlug(params.slug)

    if (!existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    await deleteProjectBySlug(params.slug)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting project:", error)
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 })
  }
}

