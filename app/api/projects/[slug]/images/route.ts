import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { ProjectImage } from '@/lib/types'

export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    // Get project ID from slug
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('id')
      .eq('slug', params.slug)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const uploadedImages: ProjectImage[] = []

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer())
      const filename = `${Date.now()}-${file.name.toLowerCase().replace(/[^a-z0-9.]/g, '-')}`
      const filePath = `projects/${params.slug}/${filename}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('project-images')
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: true
        })

      if (uploadError) {
        console.error('Error uploading image:', uploadError)
        continue
      }

      // Get public URL
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('project-images')
        .getPublicUrl(filePath)

      // Create project image record
      const { data: imageData, error: imageError } = await supabaseAdmin
        .from('project_images')
        .insert({
          project_id: project.id,
          url: publicUrl,
          alt_text: file.name.split('.')[0],
          order_index: uploadedImages.length
        })
        .select()
        .single()

      if (imageError) {
        console.error('Error creating image record:', imageError)
        continue
      }

      uploadedImages.push(imageData)
    }

    return NextResponse.json(uploadedImages)
  } catch (error) {
    console.error('Error uploading images:', error)
    return NextResponse.json(
      { error: 'Failed to upload images' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, {
  const supabaseAdmin = await getAdminClient(); params }: { params: { slug: string } }) {
  try {
    const { imageUrl } = await request.json()

    // Get project ID from slug
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('id')
      .eq('slug', params.slug)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Delete image record
    const { error: deleteError } = await supabaseAdmin
      .from('project_images')
      .delete()
      .eq('project_id', project.id)
      .eq('url', imageUrl)

    if (deleteError) {
      console.error('Error deleting image record:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete image' },
        { status: 500 }
      )
    }

    // Delete file from storage
    const filePath = new URL(imageUrl).pathname.replace('/storage/v1/object/public/project-images/', '')
    const { error: storageError } = await supabaseAdmin.storage
      .from('project-images')
      .remove([filePath])

    if (storageError) {
      console.error('Error deleting file from storage:', storageError)
      // Don't return error since the record is already deleted
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