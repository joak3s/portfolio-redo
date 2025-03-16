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

export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const projects = await getProjects()
    const project = projects.find(p => p.slug === params.slug)

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Create project directory if it doesn't exist
    const projectDir = path.join(projectsDirectory, params.slug)
    const galleryDir = path.join(projectDir, 'gallery')
    await fs.mkdir(galleryDir, { recursive: true })

    const uploadedImages: ProjectImage[] = []

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer())
      const filename = `${Date.now()}-${file.name.toLowerCase().replace(/[^a-z0-9.]/g, '-')}`
      const filePath = path.join(galleryDir, filename)
      
      await fs.writeFile(filePath, buffer)

      const imageUrl = `/projects/${params.slug}/gallery/${filename}`
      uploadedImages.push({
        url: imageUrl,
        alt: file.name.split('.')[0], // Use filename as default alt text
        caption: ''
      })
    }

    // Update project with new images
    project.images.gallery = [...(project.images.gallery || []), ...uploadedImages]
    
    // If no thumbnail exists, use the first uploaded image
    if (!project.images.thumbnail?.url && uploadedImages.length > 0) {
      project.images.thumbnail = {
        url: uploadedImages[0].url,
        alt: uploadedImages[0].alt
      }
    }

    await saveProjects(projects)

    return NextResponse.json(uploadedImages)
  } catch (error) {
    console.error('Error uploading images:', error)
    return NextResponse.json(
      { error: 'Failed to upload images' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { imageUrl } = await request.json()
    const projects = await getProjects()
    const project = projects.find(p => p.slug === params.slug)

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Remove image from gallery
    project.images.gallery = project.images.gallery.filter(img => img.url !== imageUrl)

    // If the deleted image was the thumbnail, update thumbnail to first gallery image or clear it
    if (project.images.thumbnail?.url === imageUrl) {
      project.images.thumbnail = project.images.gallery[0] || { url: '', alt: '' }
    }

    // Delete the actual file
    const filePath = path.join(process.cwd(), 'public', new URL(imageUrl).pathname)
    await fs.unlink(filePath).catch(() => {
      // Ignore error if file doesn't exist
    })

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