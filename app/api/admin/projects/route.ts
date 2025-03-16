import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { Project } from '@/lib/types'

const dataFilePath = path.join(process.cwd(), 'data', 'projects.json')
const projectsDirectory = path.join(process.cwd(), 'public', 'projects')

async function getProjects(): Promise<Project[]> {
  const data = await fs.readFile(dataFilePath, 'utf8')
  return JSON.parse(data)
}

async function saveProjects(projects: Project[]): Promise<void> {
  await fs.writeFile(dataFilePath, JSON.stringify(projects, null, 2))
}

// List all projects (admin view with all data)
export async function GET() {
  try {
    const projects = await getProjects()
    return NextResponse.json(projects)
  } catch (error) {
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
      images: {
        thumbnail: body.images?.thumbnail || {
          url: '',
          alt: '',
        },
        gallery: body.images?.gallery || []
      }
    }
    
    await saveProjects([...projects, newProject])
    return NextResponse.json(newProject)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
} 