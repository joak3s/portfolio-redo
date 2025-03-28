"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Trash2, Plus, ArrowUpDown } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { supabaseClient } from "@/lib/supabase-browser"
import type { MilestoneImage } from "@/hooks/use-journey-images"

export default function MilestoneImagesPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const milestoneId = params.id
  const [milestone, setMilestone] = useState<{ title: string } | null>(null)
  const [images, setImages] = useState<MilestoneImage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [altText, setAltText] = useState("")
  
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)
        
        // Fetch milestone details
        const { data: milestoneData, error: milestoneError } = await supabaseClient
          .from("journey_milestones")
          .select("title")
          .eq("id", milestoneId)
          .single()
          
        if (milestoneError) throw new Error(milestoneError.message)
        setMilestone(milestoneData)
        
        // Fetch milestone images
        const { data: imageData, error: imageError } = await supabaseClient
          .from("journey_milestone_images")
          .select("*")
          .eq("milestone_id", milestoneId)
          .order("order_index")
          
        if (imageError) throw new Error(imageError.message)
        setImages(imageData || [])
      } catch (error) {
        toast.error("Error loading data: " + (error instanceof Error ? error.message : String(error)))
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [milestoneId])
  
  async function handleUpload() {
    if (!selectedFile) return
    
    try {
      setIsUploading(true)
      
      // Get next order index
      const nextOrderIndex = images.length > 0 
        ? Math.max(...images.map(img => img.order_index)) + 1 
        : 0
      
      // Upload file to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${milestoneId}-${Date.now()}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabaseClient
        .storage
        .from('journey')
        .upload(fileName, selectedFile)
        
      if (uploadError) throw new Error(uploadError.message)
      
      // Get the public URL
      const { data: publicUrlData } = supabaseClient
        .storage
        .from('journey')
        .getPublicUrl(uploadData.path)
        
      // Insert image record in database
      const { data: imageData, error: insertError } = await supabaseClient
        .from("journey_milestone_images")
        .insert({
          milestone_id: milestoneId,
          url: publicUrlData.publicUrl,
          alt_text: altText || null,
          order_index: nextOrderIndex
        })
        .select()
        .single()
        
      if (insertError) throw new Error(insertError.message)
      
      // Reset form and refresh images
      setSelectedFile(null)
      setAltText("")
      setImages([...images, imageData])
      toast.success("Image uploaded successfully")
    } catch (error) {
      toast.error("Error uploading image: " + (error instanceof Error ? error.message : String(error)))
    } finally {
      setIsUploading(false)
    }
  }
  
  async function handleDeleteImage(imageId: string, imageUrl: string) {
    try {
      // Delete from the database
      const { error: deleteError } = await supabaseClient
        .from("journey_milestone_images")
        .delete()
        .eq("id", imageId)
        
      if (deleteError) throw new Error(deleteError.message)
      
      // Try to delete from storage as well (might fail if URL is external)
      try {
        // Extract path from URL
        const urlObj = new URL(imageUrl)
        const pathParts = urlObj.pathname.split('/')
        const bucketPath = pathParts[pathParts.length - 1]
        
        if (urlObj.hostname.includes('supabase')) {
          await supabaseClient
            .storage
            .from('journey')
            .remove([bucketPath])
        }
      } catch (storageError) {
        // Ignore storage deletion errors - the file might be external
        console.warn("Could not delete storage file:", storageError)
      }
      
      // Update UI
      setImages(images.filter(img => img.id !== imageId))
      toast.success("Image deleted successfully")
    } catch (error) {
      toast.error("Error deleting image: " + (error instanceof Error ? error.message : String(error)))
    }
  }
  
  async function handleUpdateOrder(imageId: string, newIndex: number) {
    try {
      // Find the image
      const image = images.find(img => img.id === imageId)
      if (!image) return
      
      // Update the order index
      const { error } = await supabaseClient
        .from("journey_milestone_images")
        .update({ order_index: newIndex })
        .eq("id", imageId)
        
      if (error) throw new Error(error.message)
      
      // Update UI
      const updatedImages = images.map(img => 
        img.id === imageId ? { ...img, order_index: newIndex } : img
      ).sort((a, b) => a.order_index - b.order_index)
      
      setImages(updatedImages)
    } catch (error) {
      toast.error("Error updating order: " + (error instanceof Error ? error.message : String(error)))
    }
  }
  
  if (isLoading) {
    return <div className="container py-10">Loading...</div>
  }
  
  if (!milestone) {
    return <div className="container py-10">Milestone not found</div>
  }
  
  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{milestone.title}: Images</h1>
          <p className="text-muted-foreground mt-1">Manage images for this journey milestone</p>
        </div>
        <Button onClick={() => router.push(`/admin/journey`)}>Back to Milestones</Button>
      </div>
      
      <Separator className="my-6" />
      
      {/* Upload form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Add New Image</CardTitle>
          <CardDescription>Upload a new image for this milestone</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="image">Image</Label>
              <Input 
                id="image" 
                type="file" 
                accept="image/*"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
            </div>
            <div>
              <Label htmlFor="alt-text">Alt Text</Label>
              <Input 
                id="alt-text" 
                placeholder="Descriptive text for accessibility"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleUpload} 
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? "Uploading..." : "Upload Image"}
          </Button>
        </CardFooter>
      </Card>
      
      {/* Image list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.map((image) => (
          <Card key={image.id}>
            <div className="relative aspect-video overflow-hidden">
              <Image
                src={image.url}
                alt={image.alt_text || "Milestone image"}
                fill
                className="object-cover"
              />
            </div>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Order: {image.order_index}</p>
                  {image.alt_text && (
                    <p className="text-sm text-muted-foreground mt-1 truncate">
                      Alt: {image.alt_text}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button 
                    size="icon" 
                    variant="outline"
                    onClick={() => handleUpdateOrder(image.id, image.order_index - 1)}
                    disabled={image.order_index === 0}
                  >
                    <ArrowUpDown className="h-4 w-4 rotate-90" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="destructive"
                    onClick={() => handleDeleteImage(image.id, image.url)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {images.length === 0 && (
          <div className="col-span-full text-center py-10 text-muted-foreground">
            No images yet. Upload your first image using the form above.
          </div>
        )}
      </div>
    </div>
  )
} 