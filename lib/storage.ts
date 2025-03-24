import { promises as fs } from 'fs'
import path from 'path'

export async function uploadImage(file: File, projectId: string) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${crypto.randomUUID()}.${fileExt}`
  const projectDir = path.join(process.cwd(), 'public', 'projects', projectId)
  const filePath = path.join(projectDir, fileName)

  // Ensure directory exists
  await fs.mkdir(projectDir, { recursive: true })

  // Convert File to Buffer
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Save file
  await fs.writeFile(filePath, buffer)

  // Return the public URL
  return {
    url: `/projects/${projectId}/${fileName}`,
    path: filePath,
    alt: file.name.split('.')[0], // Use filename as alt text
  }
}

export async function deleteImage(path: string) {
  try {
    await fs.unlink(path)
  } catch (error) {
    console.error('Error deleting image:', error)
    // Don't throw error if file doesn't exist
  }
} 