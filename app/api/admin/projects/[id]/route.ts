import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { Project } from '@/lib/types'

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
    const projects = await getProjects()
    const project = projects.find(p => p.id === params.id)
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json(project)
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
    const body = await request.json()
    const projects = await getProjects()
    
    const projectIndex = projects.findIndex(p => p.id === params.id)
    if (projectIndex === -1) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const updatedProject = {
      ...projects[projectIndex],
      ...body,
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
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projects = await getProjects()
    const project = projects.find(p => p.id === params.id)
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const filteredProjects = projects.filter(p => p.id !== params.id)
    await saveProjects(filteredProjects)
    
    // Delete project directory and all its contents
    const projectDir = path.join(projectsDirectory, project.slug)
    try {
      await fs.rm(projectDir, { recursive: true, force: true })
    } catch (error) {
      console.error('Error deleting project directory:', error)
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
  }
} 