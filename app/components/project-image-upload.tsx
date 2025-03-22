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
      const formData = new FormData()
      acceptedFiles.forEach((file) => {
        formData.append('files', file)
        formData.append('alts', file.name)
        formData.append('captions', '')
      })

      const response = await fetch(`/api/admin/projects/${projectId}/images`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload images')
      }

      const newImages = await response.json()
      onImagesUpdate([...images, ...newImages])
      
      toast({
        title: 'Success',
        description: 'Images uploaded successfully'
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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    disabled: uploading
  })

  const handleDeleteImage = async (imageUrl: string) => {
    try {
      const response = await fetch(
        `/api/admin/projects/${projectId}/images?url=${encodeURIComponent(imageUrl)}`,
        {
          method: 'DELETE'
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete image')
      }

      onImagesUpdate(images.filter((img) => img.url !== imageUrl))
      
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
      const updatedImages = images.map((img) =>
        img.url === image.url ? image : img
      )
      onImagesUpdate(updatedImages)
      setEditingImage(null)
      
      toast({
        title: 'Success',
        description: 'Image details updated successfully'
      })
    } catch (error) {
      console.error('Error updating image:', error)
      toast({
        title: 'Error',
        description: 'Failed to update image details',
        variant: 'destructive'
      })
    }
  }

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
              alt={image.alt}
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
                  onClick={() => handleDeleteImage(image.url)}
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
              value={editingImage.alt}
              onChange={(e) =>
                setEditingImage({ ...editingImage, alt: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="caption">Caption</Label>
            <Input
              id="caption"
              value={editingImage.caption || ''}
              onChange={(e) =>
                setEditingImage({ ...editingImage, caption: e.target.value })
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