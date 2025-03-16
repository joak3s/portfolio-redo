import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { Project, ProjectUpdate } from '@/lib/types'

const dataFilePath = path.join(process.cwd(), 'data', 'projects.json')
const projectsDirectory = path.join(process.cwd(), 'public', 'projects')

async function getProjects(): Promise<Project[]> {
  const data = await fs.readFile(dataFilePath, 'utf8')
  return JSON.parse(data)
}

async function saveProjects(projects: Project[]): Promise<void> {
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
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 })
  }
}

// Update a project
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const update: ProjectUpdate = await request.json()
    const projects = await getProjects()
    
    const index = projects.findIndex(p => p.id === params.id)
    if (index === -1) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    
    const updatedProject = {
      ...projects[index],
      ...update,
      updatedAt: new Date().toISOString()
    }
    
    projects[index] = updatedProject
    await saveProjects(projects)
    
    return NextResponse.json(updatedProject)
  } catch (error) {
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
    
    // Delete project directory and its contents
    const projectDir = path.join(projectsDirectory, project.slug)
    await fs.rm(projectDir, { recursive: true, force: true })
    
    const updatedProjects = projects.filter(p => p.id !== params.id)
    await saveProjects(updatedProjects)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
  }
} 