import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { Project } from '@/lib/types'

// Use the public directory which is supported in production
const dataFilePath = path.join(process.cwd(), 'public', 'data', 'projects.json')
const projectsDirectory = path.join(process.cwd(), 'public', 'projects')

async function getProjects(): Promise<Project[]> {
  try {
    const data = await fs.readFile(dataFilePath, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    // If file doesn't exist, return empty array
    return []
  }
}

async function saveProjects(projects: Project[]): Promise<void> {
  // Ensure the data directory exists
  await fs.mkdir(path.dirname(dataFilePath), { recursive: true })
  await fs.writeFile(dataFilePath, JSON.stringify(projects, null, 2))
}

// List all projects (admin view with all data)
export async function GET() {
  try {
    const projects = await getProjects()
    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}

// Create a new project
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const projects = await getProjects()
    
    // Create project directory if it doesn't exist
    const projectDir = path.join(projectsDirectory, body.slug)
    await fs.mkdir(projectDir, { recursive: true })
    
    const newProject: Project = {
      ...body,
      id: crypto.randomUUID(),
      publishedAt: new Date().toISOString(),
      status: 'draft',
      images: body.images || []
    }
    
    await saveProjects([...projects, newProject])
    return NextResponse.json(newProject)
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}

// Update a project
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body
    const projects = await getProjects()
    
    const projectIndex = projects.findIndex(p => p.id === id)
    if (projectIndex === -1) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const updatedProject = {
      ...projects[projectIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    }

    projects[projectIndex] = updatedProject
    await saveProjects(projects)
    
    return NextResponse.json(updatedProject)
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
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

    const projects = await getProjects()
    const filteredProjects = projects.filter(p => p.id !== id)
    
    if (filteredProjects.length === projects.length) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    await saveProjects(filteredProjects)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
  }
} 