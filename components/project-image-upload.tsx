'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2, Upload } from 'lucide-react'
import { ProjectImage } from '@/lib/types'
import { toast } from '@/hooks/use-toast'
import { supabaseClient } from '@/lib/supabase'

interface ProjectImageUploadProps {
  projectId: string
  images: ProjectImage[]
  onImagesUpdate: (images: ProjectImage[]) => void
}

export function ProjectImageUpload({
  projectId,
  images,
  onImagesUpdate
}: ProjectImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [editingImage, setEditingImage] = useState<ProjectImage | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const totalImages = images.length + acceptedFiles.length
    if (totalImages > 5) {
      toast({
        title: 'Error',
        description: 'Maximum 5 images allowed per project',
        variant: 'destructive'
      })
      return
    }

    setUploading(true)
    try {
      const newImages: ProjectImage[] = []

      for (const file of acceptedFiles) {
        // Validate file size
        if (file.size > 5 * 1024 * 1024) { // 5MB
          throw new Error(`File ${file.name} is too large. Maximum size is 5MB.`)
        }

        // Generate unique filename
        const timestamp = Date.now()
        const fileExt = file.name.split('.').pop()?.toLowerCase()
        const fileName = `${projectId}/${timestamp}-${Math.random().toString(36).substring(2)}.${fileExt}`

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabaseClient.storage
          .from('project-images')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          throw new Error(`Error uploading ${file.name}: ${uploadError.message}`)
        }

        // Get public URL
        const { data: { publicUrl } } = supabaseClient.storage
          .from('project-images')
          .getPublicUrl(fileName)

        // Create project image record
        const { data: imageData, error: dbError } = await supabaseClient
          .from('project_images')
          .insert({
            project_id: projectId,
            url: publicUrl,
            alt_text: file.name.split('.')[0],
            order_index: images.length + newImages.length
          })
          .select('*')
          .single()

        if (dbError) {
          throw new Error(`Error saving image record: ${dbError.message}`)
        }

        newImages.push(imageData)
      }

      onImagesUpdate([...images, ...newImages])
      
      toast({
        title: 'Success',
        description: `Successfully uploaded ${newImages.length} image${newImages.length > 1 ? 's' : ''}`
      })
    } catch (error) {
      console.error('Error uploading images:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to upload images',
        variant: 'destructive'
      })
    } finally {
      setUploading(false)
    }
  }, [projectId, images, onImagesUpdate])

  const handleDeleteImage = async (image: ProjectImage) => {
    try {
      // Delete from Supabase Storage
      const fileName = image.url.split('/').pop()
      if (fileName) {
        const { error: storageError } = await supabaseClient.storage
          .from('project-images')
          .remove([`${projectId}/${fileName}`])

        if (storageError) {
          throw new Error(`Error deleting file: ${storageError.message}`)
        }
      }

      // Delete from database
      const { error: dbError } = await supabaseClient
        .from('project_images')
        .delete()
        .eq('project_id', projectId)
        .eq('url', image.url)

      if (dbError) {
        throw new Error(`Error deleting image record: ${dbError.message}`)
      }

      // Update local state
      onImagesUpdate(images.filter(img => img.url !== image.url))
      
      toast({
        title: 'Success',
        description: 'Image deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting image:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete image',
        variant: 'destructive'
      })
    }
  }

  const handleUpdateImage = async (image: ProjectImage) => {
    try {
      const { error: dbError } = await supabaseClient
        .from('project_images')
        .update({
          alt_text: image.alt_text,
          order_index: image.order_index
        })
        .eq('project_id', projectId)
        .eq('url', image.url)

      if (dbError) {
        throw new Error(`Error updating image: ${dbError.message}`)
      }

      onImagesUpdate(images.map(img => 
        img.url === image.url ? image : img
      ))
      
      setEditingImage(null)
      
      toast({
        title: 'Success',
        description: 'Image details updated successfully'
      })
    } catch (error) {
      console.error('Error updating image:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update image',
        variant: 'destructive'
      })
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    disabled: uploading
  })

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {isDragActive
            ? 'Drop the files here...'
            : 'Drag & drop images here, or click to select files'}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Maximum 5 images, up to 5MB each
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((image) => (
          <div
            key={image.url}
            className="relative group aspect-[4/3] rounded-lg overflow-hidden border"
          >
            <Image
              src={image.url}
              alt={image.alt_text || ''}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-200">
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditingImage(image)}
                >
                  Edit Details
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteImage(image)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editingImage && (
        <div className="border rounded-lg p-4 space-y-4">
          <h4 className="font-medium">Edit Image Details</h4>
          <div className="space-y-2">
            <Label htmlFor="alt">Alt Text</Label>
            <Input
              id="alt"
              value={editingImage.alt_text || ''}
              onChange={(e) =>
                setEditingImage({ ...editingImage, alt_text: e.target.value })
              }
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setEditingImage(null)}
            >
              Cancel
            </Button>
            <Button onClick={() => handleUpdateImage(editingImage)}>
              Save Changes
            </Button>
          </div>
        </div>
      )}
    </div>
  )
} 