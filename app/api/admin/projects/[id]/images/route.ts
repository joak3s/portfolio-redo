import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { Project, ProjectImage } from '@/lib/types'

const dataFilePath = path.join(process.cwd(), 'data', 'projects.json')
const projectsDirectory = path.join(process.cwd(), 'public', 'projects')

async function getProjects(): Promise<Project[]> {
  const data = await fs.readFile(dataFilePath, 'utf8')
  return JSON.parse(data)
}

async function saveProjects(projects: Project[]): Promise<void> {
  await fs.writeFile(dataFilePath, JSON.stringify(projects, null, 2))
}

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const projectId = context.params.id

    // Validate project ID
    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const captions = formData.getAll('captions') as string[]
    const alts = formData.getAll('alts') as string[]

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }

    if (files.length > 5) {
      return NextResponse.json(
        { error: 'Maximum 5 images allowed per project' },
        { status: 400 }
      )
    }

    const projects = await getProjects()
    const project = projects.find(p => p.id === projectId)

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Create project directory if it doesn't exist
    const projectDir = path.join(projectsDirectory, project.slug)
    await fs.mkdir(projectDir, { recursive: true })

    const newImages: ProjectImage[] = []

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const caption = captions[i]
      const alt = alts[i]

      // Generate unique filename
      const extension = path.extname(file.name)
      const filename = `gallery-${Date.now()}-${i}${extension}`
      const filepath = path.join(projectDir, filename)
      const publicPath = `/projects/${project.slug}/${filename}`

      // Save file
      const bytes = await file.arrayBuffer()
      await fs.writeFile(filepath, Buffer.from(bytes))

      // Add to images array
      newImages.push({
        url: publicPath,
        alt: alt || file.name,
        caption: caption || undefined,
        isFeatured: i === 0 && !project.images.gallery?.length // First image is featured only if no other images exist
      })
    }

    // Update project data
    if (!project.images.gallery) {
      project.images.gallery = []
    }
    project.images.gallery = [...project.images.gallery, ...newImages]

    // If no thumbnail exists, use the first uploaded image
    if (!project.images.thumbnail?.url && newImages.length > 0) {
      project.images.thumbnail = {
        url: newImages[0].url,
        alt: newImages[0].alt
      }
    }

    // Save updated project data
    const projectIndex = projects.findIndex(p => p.id === projectId)
    projects[projectIndex] = project
    await saveProjects(projects)

    return NextResponse.json(newImages)
  } catch (error) {
    console.error('Error uploading images:', error)
    return NextResponse.json(
      { error: 'Failed to upload images' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const projectId = context.params.id
    const { searchParams } = new URL(request.url)
    const imageUrl = searchParams.get('url')

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      )
    }

    const projects = await getProjects()
    const project = projects.find(p => p.id === projectId)

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Remove file from filesystem
    const filename = path.basename(imageUrl)
    const filepath = path.join(projectsDirectory, project.slug, filename)
    
    try {
      await fs.unlink(filepath)
    } catch (error) {
      console.error('Error deleting file:', error)
      // Continue even if file doesn't exist
    }

    // Update project data
    if (project.images.thumbnail?.url === imageUrl) {
      // If deleting thumbnail, replace with first gallery image or empty
      project.images.thumbnail = project.images.gallery?.[0] || {
        url: '',
        alt: ''
      }
    }
    
    if (project.images.gallery) {
      project.images.gallery = project.images.gallery.filter(
        img => img.url !== imageUrl
      )
    }

    // Save updated project data
    const projectIndex = projects.findIndex(p => p.id === projectId)
    projects[projectIndex] = project
    await saveProjects(projects)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting image:', error)
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    )
  }
} 