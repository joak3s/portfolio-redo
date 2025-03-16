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

export async function GET() {
  try {
    const projects = await getProjects()
    return NextResponse.json(projects)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}

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
      images: {
        thumbnail: body.images.thumbnail,
        gallery: body.images.gallery || []
      }
    }
    
    await saveProjects([...projects, newProject])
    return NextResponse.json(newProject)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const update: ProjectUpdate = await request.json()
    const projects = await getProjects()
    
    const index = projects.findIndex(p => p.id === update.id)
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

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }
    
    const projects = await getProjects()
    const project = projects.find(p => p.id === id)
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    
    // Delete project directory and its contents
    const projectDir = path.join(projectsDirectory, project.slug)
    await fs.rm(projectDir, { recursive: true, force: true })
    
    const updatedProjects = projects.filter(p => p.id !== id)
    await saveProjects(updatedProjects)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
  }
}

