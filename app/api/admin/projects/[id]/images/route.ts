import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'

// Define a simpler interface for image data returned to the client
interface ImageResponse {
  url: string
  alt: string
  caption?: string
}

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const projectId = context.params.id
    const supabaseAdmin = await getAdminClient()

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

    // Verify project exists
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('slug')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    const newImages: ImageResponse[] = []

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const caption = captions[i]
      const alt = alts[i]

      // Generate unique filename
      const timestamp = Date.now()
      const extension = file.name.split('.').pop()
      const filename = `${project.slug}/gallery-${timestamp}-${i}.${extension}`

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabaseAdmin
        .storage
        .from('projects')
        .upload(filename, file, {
          contentType: file.type,
          upsert: true
        })

      if (uploadError) {
        console.error('Error uploading file:', uploadError)
        continue
      }

      // Get public URL
      const { data: { publicUrl } } = supabaseAdmin
        .storage
        .from('projects')
        .getPublicUrl(filename)

      // Add to images array
      const imageData: ImageResponse = {
        url: publicUrl,
        alt: alt || file.name,
        caption: caption || undefined
      }
      newImages.push(imageData)

      // Insert image record into database
      const { error: dbError } = await supabaseAdmin
        .from('project_images')
        .insert({
          project_id: projectId,
          url: publicUrl,
          alt_text: alt || file.name,
          order_index: i // Use index as order_index
        })

      if (dbError) {
        console.error('Error saving image to database:', dbError)
      }
    }

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
    const supabaseAdmin = await getAdminClient()
    const { searchParams } = new URL(request.url)
    const imageUrl = searchParams.get('url')

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      )
    }

    // Get project slug
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('slug')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Delete image from storage
    const filename = imageUrl.split('/').pop()
    if (filename) {
      const storagePath = `${project.slug}/${filename}`
      const { error: storageError } = await supabaseAdmin
        .storage
        .from('projects')
        .remove([storagePath])

      if (storageError) {
        console.error('Error deleting file from storage:', storageError)
      }
    }

    // Delete image record from database
    const { error: dbError } = await supabaseAdmin
      .from('project_images')
      .delete()
      .eq('project_id', projectId)
      .eq('url', imageUrl)

    if (dbError) {
      console.error('Error deleting image from database:', dbError)
      return NextResponse.json(
        { error: 'Failed to delete image record' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting image:', error)
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    )
  }
} 