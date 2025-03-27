import { supabaseClient } from './supabase-browser'

const BUCKET_NAME = 'project-images'

export async function uploadImage(file: File, projectId: string) {
  try {
    // Create a unique file name
    const fileExt = file.name.split('.').pop()
    const fileName = `${projectId}/${crypto.randomUUID()}.${fileExt}`

    // Upload file to Supabase Storage
    const { data, error } = await supabaseClient.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      throw error
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseClient.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName)

    return {
      url: publicUrl,
      path: fileName,
      alt: file.name.split('.')[0], // Use filename as alt text
    }
  } catch (error) {
    console.error('Error uploading image:', error)
    throw error
  }
}

export async function deleteImage(path: string) {
  try {
    const { error } = await supabaseClient.storage
      .from(BUCKET_NAME)
      .remove([path])

    if (error) {
      throw error
    }
  } catch (error) {
    console.error('Error deleting image:', error)
    throw error
  }
} 