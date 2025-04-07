"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, Edit, Trash2, X, ArrowLeft, Upload, Image as ImageIcon, MoreHorizontal, Check, FolderKanban, PanelsTopLeft } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { supabaseClient } from "@/lib/supabase-browser"
import Image from "next/image"
import type { CreateJourneyInput } from '@/lib/types/journey'
import type { Database } from '@/lib/database.types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

// Actions
import { 
  getJourneyEntries, 
  createJourneyEntry, 
  updateJourneyEntry, 
  deleteJourneyEntry,
  addJourneyImage,
  deleteJourneyImage,
  updateJourneyImageOrder
} from '@/app/actions/admin'

// Types
import type { JourneyEntry, JourneyImage } from '@/lib/types/journey'

// Define our local types based on database types
type LocalJourneyImage = Database['public']['Tables']['journey_images']['Row'];
type LocalJourneyEntry = Database['public']['Tables']['journey']['Row'] & {
  journey_images?: LocalJourneyImage[];
}

export default function AdminJourneyPage() {
  const [journeyEntries, setJourneyEntries] = useState<LocalJourneyEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [subtitle, setSubtitle] = useState("")
  const [year, setYear] = useState("")
  const [description, setDescription] = useState("")
  const [skills, setSkills] = useState<string[]>([])
  const [currentSkill, setCurrentSkill] = useState("")
  const [icon, setIcon] = useState("image")
  const [color, setColor] = useState("bg-blue-500/10 dark:bg-blue-500/20")
  const [image, setImage] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [display_order, setDisplayOrder] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("general")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { toast } = useToast()
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [reorderingImages, setReorderingImages] = useState<{id: string, url: string, order_index: number}[]>([])
  const [isReordering, setIsReordering] = useState(false)
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [newEntry, setNewEntry] = useState<CreateJourneyInput>({
    title: '',
    subtitle: '',
    year: '',
    description: '',
    skills: [],
    icon: '',
    color: '#3b82f6',
    display_order: 1
  })
  const [selectedEntry, setSelectedEntry] = useState<LocalJourneyEntry | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [newImageUrl, setNewImageUrl] = useState('')
  const [newImageAlt, setNewImageAlt] = useState('')

  // Fetch journey entries
  useEffect(() => {
    fetchJourneyEntries()
  }, [])

  const resetForm = () => {
    setTitle("")
    setSubtitle("")
    setYear("")
    setDescription("")
    setSkills([])
    setCurrentSkill("")
    setIcon("image")
    setColor("bg-blue-500/10 dark:bg-blue-500/20")
    setImage("")
    setImageFile(null)
    setImagePreview(null)
    setDisplayOrder(0)
    setCurrentId(null)
    setActiveTab("general")
  }

  const fetchJourneyEntries = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const entries = await getJourneyEntries()
      setJourneyEntries(entries)
      
      // Reset retry count on success
      setRetryCount(0)
    } catch (err) {
      console.error("Error fetching journey entries:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch journey entries")
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch journey entries."
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddSkill = () => {
    if (currentSkill.trim() && !skills.includes(currentSkill.trim())) {
      setSkills([...skills, currentSkill.trim()])
      setCurrentSkill("")
    }
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file type
    const acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
    if (!acceptedTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload a JPEG, PNG, GIF, WEBP, or SVG image"
      })
      return
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Image must be less than 5MB"
      })
      return
    }

    setImageFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Clear the URL input when a file is selected
    setImage("")
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this journey entry?")) return

    try {
      // Delete directly using Supabase client
      console.log('Deleting journey entry with ID:', id)
      
      // First, delete any associated images from journey_images
      console.log('Deleting associated images')
      const { error: imagesError } = await supabaseClient
        .from('journey_images')
        .delete()
        .eq('journey_id', id)
      
      if (imagesError) {
        console.error('Error deleting journey images:', imagesError)
        // Continue with deletion even if image deletion fails
      } else {
        console.log('Journey images deleted successfully')
      }
      
      // Then delete the journey entry
      console.log('Deleting journey entry')
      const { error: deleteError } = await supabaseClient
        .from('journey')
        .delete()
        .eq('id', id)
      
      if (deleteError) {
        console.error('Error deleting journey entry:', deleteError)
        throw new Error(`Failed to delete journey entry: ${deleteError.message}`)
      }
      
      console.log('Journey entry deleted successfully')

      toast({
        title: "Success",
        description: "Journey entry deleted successfully."
      })

      // Refresh the journey list
      fetchJourneyEntries()
    } catch (err) {
      console.error("Error deleting journey entry:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete journey entry."
      })
    }
  }

  const handleCreate = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const handleEdit = (entry: LocalJourneyEntry) => {
    setCurrentId(entry.id)
    setTitle(entry.title)
    setSubtitle(entry.subtitle || '')
    setYear(entry.year)
    setDescription(entry.description)
    setSkills(entry.skills || [])
    setIcon(entry.icon)
    setColor(entry.color)
    setDisplayOrder(entry.display_order)

    // Set image preview if available from the first image (main image)
    if (entry.journey_images && entry.journey_images.length > 0) {
      setImagePreview(entry.journey_images[0].url)
    } else {
      setImagePreview(null)
    }

    // Reset any file upload state
    setImageFile(null)
    setImage("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    setIsDialogOpen(true)
    // Default to media tab if the entry has multiple images
    if (entry.journey_images && entry.journey_images.length > 1) {
      setActiveTab("media")
    } else {
      setActiveTab("general")
    }
  }

  /**
   * Submit form data to create or edit a journey entry
   */
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      console.log('Submitting journey form data');

      // Validate required fields
      if (!title || !year || !description || skills.length === 0 || !icon || !color) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Please fill out all required fields."
        });
        setIsSubmitting(false);
        return;
      }

      // If we have a file, upload it first
      let uploadedImageUrl = image || '';

      if (imageFile) {
        setIsUploading(true);
        console.log('Uploading image file directly to Supabase...');

        try {
          // Generate a unique filename
          const timestamp = new Date().getTime();
          const uniqueId = Math.random().toString(36).substring(2, 11);
          const fileExt = imageFile.name.split('.').pop()?.toLowerCase() || 'jpg';
          const filePath = `journey/${timestamp}-${uniqueId}.${fileExt}`;

          // Upload directly to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabaseClient.storage
            .from('public')
            .upload(filePath, imageFile, {
              cacheControl: '3600',
              upsert: false,
              contentType: imageFile.type
            });

          if (uploadError) {
            console.error('Storage upload error:', uploadError);
            throw new Error(`Failed to upload image: ${uploadError.message}`);
          }

          if (!uploadData?.path) {
            throw new Error('Upload successful but no path returned');
          }

          // Get the public URL
          const { data: urlData } = supabaseClient.storage
            .from('public')
            .getPublicUrl(uploadData.path);

          if (!urlData?.publicUrl) {
            throw new Error('Failed to get public URL for uploaded image');
          }

          uploadedImageUrl = urlData.publicUrl;
          console.log('Image uploaded successfully:', uploadedImageUrl);
          
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
          toast({
            variant: "destructive",
            title: "Upload Error",
            description: uploadError instanceof Error ? uploadError.message : "Failed to upload image"
          });
          setIsSubmitting(false);
          setIsUploading(false);
          return;
        } finally {
          setIsUploading(false);
        }
      }

      // Extract and format the data
      const formData = {
        title,
        subtitle,
        year,
        description,
        skills,
        icon,
        color,
        display_order,
        image_url: uploadedImageUrl
      };

      console.log('Processed form data:', {
        title: formData.title,
        subtitle: formData.subtitle,
        year: formData.year,
        hasSkills: formData.skills?.length > 0,
        hasImage: !!formData.image_url
      });

      try {
        if (currentId) {
          // Update existing entry directly with Supabase client
          console.log(`Directly updating journey entry with ID: ${currentId}`);
          
          // First, update the journey entry
          const { data: journeyData, error: updateError } = await supabaseClient
            .from('journey')
            .update({
              title: formData.title,
              subtitle: formData.subtitle || null,
              year: formData.year,
              description: formData.description,
              skills: formData.skills,
              icon: formData.icon,
              color: formData.color,
              display_order: formData.display_order
            })
            .eq('id', currentId)
            .select('*')
            .single();
          
          if (updateError) {
            console.error('Error updating journey entry:', updateError);
            throw new Error(`Failed to update journey entry: ${updateError.message}`);
          }
          
          // If we have a new image URL, add it to journey_images
          if (formData.image_url) {
            console.log('Adding new image to updated journey entry');
            
            // First, get current images to determine highest order_index
            const { data: existingImages, error: fetchError } = await supabaseClient
              .from('journey_images')
              .select('order_index')
              .eq('journey_id', currentId)
              .order('order_index', { ascending: false });
            
            if (fetchError) {
              console.error('Error fetching existing images:', fetchError);
            }
            
            const nextOrderIndex = existingImages && existingImages.length > 0 
              ? existingImages[0].order_index + 1 
              : 1;
            
            console.log('Adding image with order index:', nextOrderIndex);
            const { error: imageError } = await supabaseClient
              .from('journey_images')
              .insert({
                journey_id: currentId,
                url: formData.image_url,
                order_index: nextOrderIndex
              });
            
            if (imageError) {
              console.error('Error adding journey image:', imageError);
              throw new Error(`Failed to add image: ${imageError.message}`);
            } else {
              console.log('Image added successfully to updated journey entry');
            }
          }
          
          toast({
            title: "Journey entry updated successfully",
          });
        } else {
          // Create new entry directly with Supabase client
          console.log('Directly creating new journey entry');
          
          // Insert the new journey entry
          const { data: journeyData, error: createError } = await supabaseClient
            .from('journey')
            .insert({
              title: formData.title,
              subtitle: formData.subtitle || null,
              year: formData.year,
              description: formData.description,
              skills: formData.skills,
              icon: formData.icon,
              color: formData.color,
              display_order: formData.display_order
            })
            .select('*')
            .single();
          
          if (createError) {
            console.error('Error creating journey entry:', createError);
            throw new Error(`Failed to create journey entry: ${createError.message}`);
          }
          
          console.log('Journey entry created with ID:', journeyData.id);
          
          // If we have an image URL, associate it with the journey entry
          if (formData.image_url) {
            console.log('Adding image to new journey entry');
            
            const { error: imageError } = await supabaseClient
              .from('journey_images')
              .insert({
                journey_id: journeyData.id,
                url: formData.image_url,
                order_index: 1
              });
            
            if (imageError) {
              console.error('Error adding journey image:', imageError);
              throw new Error(`Failed to add image: ${imageError.message}`);
            } else {
              console.log('Image added successfully to new journey entry');
            }
          }
          
          toast({
            title: "Journey entry created successfully",
          });
        }
        
        // Reset form and close modal
        resetForm();
        setIsDialogOpen(false);
        
        // Refresh journey list
        fetchJourneyEntries();
        
      } catch (error) {
        console.error('Error saving journey entry:', error);
        toast({
          title: "Error saving journey entry",
          description: error instanceof Error ? error.message : "Unknown error occurred",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setImage("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDeleteJourneyImage = async (imageId: string) => {
    setDeletingImageId(imageId)
    setDeleteConfirmOpen(true)
  }
  
  const confirmDeleteJourneyImage = async () => {
    if (!deletingImageId) return
    
    try {
      setIsDeleting(true)
      setActionInProgress('delete-image')
      
      // Use direct Supabase client call instead of server action
      const { error: deleteError } = await supabaseClient
        .from('journey_images')
        .delete()
        .eq('id', deletingImageId)
      
      if (deleteError) {
        console.error('Error deleting journey image:', deleteError)
        throw new Error(deleteError.message)
      }
      
      // After successful deletion, reorder remaining images
      if (currentId) {
        await reorderImagesAfterDeletion(currentId)
      }
      
      toast({
        title: "Image deleted",
        description: "The image has been successfully deleted."
      })
      
      // Refresh the journey entries to update the UI
      await fetchJourneyEntries()
      
      // Close the confirmation dialog
      setDeleteConfirmOpen(false)
      
    } catch (error) {
      console.error("Error deleting journey image:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete journey image."
      })
    } finally {
      setIsDeleting(false)
      setDeletingImageId(null)
      setActionInProgress(null)
    }
  }
  
  // Function to reorder images after deletion
  const reorderImagesAfterDeletion = async (journeyId: string) => {
    try {
      // Get all remaining images for this journey entry, sorted by current order
      const { data: images, error: fetchError } = await supabaseClient
        .from('journey_images')
        .select('id, order_index')
        .eq('journey_id', journeyId)
        .order('order_index', { ascending: true })
      
      if (fetchError) {
        console.error('Error fetching images for reordering:', fetchError)
        return
      }
      
      // Update each image with a sequential order_index starting from 1
      for (let i = 0; i < images.length; i++) {
        const newIndex = i + 1
        
        // Only update if the order has changed
        if (images[i].order_index !== newIndex) {
          const { error } = await supabaseClient
            .from('journey_images')
            .update({ order_index: newIndex })
            .eq('id', images[i].id)
          
          if (error) {
            console.error(`Error reordering image ${images[i].id}:`, error)
          }
        }
      }
    } catch (error) {
      console.error('Error in reorderImagesAfterDeletion:', error)
    }
  }
  
  const handleReorderImages = (currentEntry: LocalJourneyEntry) => {
    if (!currentEntry?.journey_images?.length) return
    
    // Initialize reorderingImages with the current images
    setReorderingImages(
      currentEntry.journey_images.map(img => ({
        id: img.id,
        url: img.url,
        order_index: img.order_index
      }))
    )
    setIsReordering(true)
  }
  
  const moveImage = (fromIndex: number, toIndex: number) => {
    setReorderingImages(prev => {
      const newOrder = [...prev]
      const [movedItem] = newOrder.splice(fromIndex, 1)
      newOrder.splice(toIndex, 0, movedItem)
      
      // Update order_index for display purposes
      return newOrder.map((img, idx) => ({
        ...img,
        order_index: idx + 1
      }))
    })
  }
  
  const saveImageOrder = async () => {
    if (!currentId || reorderingImages.length === 0) return
    
    try {
      setActionInProgress('reorder-images')
      
      // Update each image with its new order directly using Supabase client
      for (let i = 0; i < reorderingImages.length; i++) {
        const { error } = await supabaseClient
          .from('journey_images')
          .update({ order_index: i + 1 })
          .eq('id', reorderingImages[i].id)
          .eq('journey_id', currentId)
        
        if (error) {
          console.error(`Error updating image order for ${reorderingImages[i].id}:`, error)
          throw new Error(`Error updating image order: ${error.message}`)
        }
      }
      
      toast({
        title: "Order updated",
        description: "Image order has been successfully updated."
      })
      
      // Refresh the journey entries
      await fetchJourneyEntries()
      setIsReordering(false)
      
    } catch (error) {
      console.error("Error updating image order:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update image order."
      })
    } finally {
      setActionInProgress(null)
    }
  }

  const renderExistingImages = () => {
    const currentEntry = journeyEntries.find(entry => entry.id === currentId);
    if (!currentEntry?.journey_images?.length) {
      return <p className="text-sm text-muted-foreground">No images have been added to this entry yet.</p>;
    }
    
    return (
      <>
        <div className="flex justify-between items-center mb-3">
          <Label>Existing Images</Label>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleReorderImages(currentEntry)}
              disabled={currentEntry.journey_images.length < 2}
              className="text-xs"
            >
              <FolderKanban className="h-3.5 w-3.5 mr-1" />
              Reorder
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {currentEntry.journey_images.map((img, idx) => (
            <div 
              key={img.id} 
              className="relative group border rounded-md overflow-hidden aspect-video"
            >
              <Image
                src={img.url}
                alt={`Image ${idx + 1}`}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Badge variant={idx === 0 ? "default" : "outline"} className="absolute top-2 left-2">
                  {idx === 0 ? "Main" : `#${idx + 1}`}
                </Badge>
                
                <Button 
                  size="sm" 
                  variant="destructive" 
                  className="opacity-90"
                  onClick={() => handleDeleteJourneyImage(img.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  };

  if (isLoading) {
    return (
      <div className="container py-10 flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Loading journey entries...</p>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Journey Timeline</h1>
            <p className="text-muted-foreground">Manage your professional journey entries.</p>
          </div>
          <div className="flex flex-col md:flex-row gap-2">
            <Button variant="outline" className="w-full md:w-auto" asChild>
              <Link href="/admin">
                <PanelsTopLeft className="mr-2 h-4 w-4" /> Projects
              </Link>
            </Button>
          <Button onClick={handleCreate} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Entry
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {journeyEntries.length === 0 && !isLoading ? (
          <Card className="mb-8">
            <CardContent className="pt-6 pb-6">
              <div className="text-center py-12">
                <p className="mb-6 text-muted-foreground">No journey entries found.</p>
                <Button onClick={handleCreate}>Create Your First Journey Entry</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Order</TableHead>
                    <TableHead className="w-[100px]">Year</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Skills</TableHead>
                    <TableHead className="w-[160px]">Image</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {journeyEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-mono p-6">{entry.display_order}</TableCell>
                      <TableCell className="text-lg font-bold">{entry.year}</TableCell>
                      <TableCell>
                        <div className="font-medium">{entry.title}</div>
                        <div className="max-w-md text-sm text-muted-foreground line-clamp-2">{entry.description}</div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs flex flex-wrap gap-1">
                          {entry.skills.slice(0, 3).map((skill, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {entry.skills.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{entry.skills.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="relative w-28 h-16 rounded-md overflow-hidden border bg-muted">
                          {entry.journey_images && entry.journey_images.length > 0 ? (
                            <Image
                              src={entry.journey_images[0].url}
                              alt={entry.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handleEdit(entry)}
                            title="Edit entry"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handleDelete(entry.id)}
                            title="Delete entry"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="grid grid-cols-1 md:hidden gap-4">
              {journeyEntries.map((entry) => (
                <Card key={entry.id} className="overflow-hidden">
                  <div className="relative aspect-video bg-muted">
                    {entry.journey_images && entry.journey_images.length > 0 ? (
                      <Image
                        src={entry.journey_images[0].url}
                        alt={entry.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-muted text-muted-foreground">
                        <ImageIcon className="h-10 w-10 opacity-20" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon"
                            variant="secondary"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(entry)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(entry.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{entry.title}</CardTitle>
                        <CardDescription>{entry.year}</CardDescription>
                      </div>
                      <Badge variant="outline">Order: {entry.display_order}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-3">{entry.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {entry.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                    {entry.journey_images && entry.journey_images.length > 1 && (
                      <div className="mt-3">
                        <p className="text-xs text-muted-foreground mb-2">Additional Images: {entry.journey_images.length - 1}</p>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {entry.journey_images.slice(1).map((image, index) => (
                            <div key={index} className="relative h-14 w-14 flex-shrink-0 rounded-md overflow-hidden border">
                              <Image
                                src={image.url}
                                alt={`Additional image ${index + 1}`}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Modal for Create/Edit */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{currentId ? "Edit Journey Entry" : "Create Journey Entry"}</DialogTitle>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="media">Media</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4 mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., First Graphic Design Project"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year">Year *</Label>
                    <Input
                      id="year"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      placeholder="e.g., 2010"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subtitle">Subtitle</Label>
                  <Input
                    id="subtitle"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="e.g., A brief subtitle or role"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe this journey entry and its significance in your journey."
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Skills *</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={currentSkill}
                      onChange={(e) => setCurrentSkill(e.target.value)}
                      placeholder="e.g., Photoshop"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          handleAddSkill()
                        }
                      }}
                    />
                    <Button type="button" onClick={handleAddSkill}>Add</Button>
                  </div>

                  {/* Quick add suggested skills */}
                  <div className="mt-2 mb-3">
                    <Label className="text-xs mb-1">Suggested Skill Sets:</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          setSkills(["Adobe Illustrator", "Brand Design", "Typography", "Client Communication"])
                        }}
                      >
                        Design
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          setSkills(["Cognitive Psychology", "Programming Fundamentals", "HCI Research", "Information Architecture"])
                        }}
                      >
                        Education
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          setSkills(["Web Design", "HTML/CSS", "Motion Graphics", "Client Presentations"])
                        }}
                      >
                        Web Design
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          setSkills(["React", "Next.js", "UI Design", "Database Architecture", "Full-Stack Development"])
                        }}
                      >
                        Full-Stack
                      </Button>
                    </div>
                  </div>

                  {skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {skills.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {skill}
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(skill)}
                            className="ml-1 rounded-full hover:bg-muted p-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No skills added yet.</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="icon">Icon *</Label>
                    <select
                      id="icon"
                      value={icon}
                      onChange={(e) => setIcon(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      required
                    >
                      <option value="image">Image</option>
                      <option value="code">Code</option>
                      <option value="layout">Layout</option>
                      <option value="briefcase">Briefcase</option>
                      <option value="message-square">Message Square</option>
                      <option value="tool">Tool</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="color">Color *</Label>
                    <select
                      id="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      required
                    >
                      <option value="bg-blue-500/10 dark:bg-blue-500/20">Blue</option>
                      <option value="bg-green-500/10 dark:bg-green-500/20">Green</option>
                      <option value="bg-purple-500/10 dark:bg-purple-500/20">Purple</option>
                      <option value="bg-orange-500/10 dark:bg-orange-500/20">Orange</option>
                      <option value="bg-pink-500/10 dark:bg-pink-500/20">Pink</option>
                      <option value="bg-red-500/10 dark:bg-red-500/20">Red</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="display_order">Display Order *</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={display_order}
                    onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                    placeholder="e.g., 1"
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Order of the entry (lower numbers appear first)
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="media" className="space-y-4 mt-0">
                <div className="space-y-2">
                  <Label htmlFor="image">Entry Image</Label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      {/* Hidden file input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                        className="hidden"
                        onChange={handleImageChange}
                      />

                      {/* Custom upload button */}
                      <div className="flex flex-col gap-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={triggerFileInput}
                          className="w-full flex items-center gap-2"
                          disabled={isSubmitting || isUploading}
                        >
                          <Upload className="h-4 w-4" />
                          Choose Image File
                        </Button>

                        {/* Alternative URL input */}
                        <div className="space-y-2">
                          <Label htmlFor="imageUrl" className="text-sm">Or enter image URL directly:</Label>
                          <Input
                            id="imageUrl"
                            value={image}
                            onChange={(e) => {
                              setImage(e.target.value)
                              // Clear file selection if URL is provided
                              if (e.target.value) {
                                setImageFile(null)
                                setImagePreview(null)
                                if (fileInputRef.current) {
                                  fileInputRef.current.value = ''
                                }
                              }
                            }}
                            placeholder="e.g., https://example.com/image.jpg"
                            disabled={isSubmitting || isUploading}
                          />
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          onClick={removeImage}
                          className="w-full flex items-center gap-2 text-destructive"
                          disabled={isSubmitting || isUploading || (!imageFile && !image && !imagePreview)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Clear Image
                        </Button>

                        <p className="text-xs text-muted-foreground">
                          Recommended size: 1200×800px. Max file size: 5MB.
                        </p>
                        
                        {currentId && (
                          <p className="text-xs text-muted-foreground mt-4">
                            Note: Adding a new image to an existing entry will keep previous images.
                            The first uploaded image is used as the main thumbnail.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Preview area */}
                    <div className="relative border rounded-md overflow-hidden h-[200px] bg-muted/30 flex items-center justify-center">
                      {imagePreview || image ? (
                        <Image
                          src={imagePreview || image}
                          alt="Image preview"
                          fill
                          sizes="(max-width: 768px) 100vw, 400px"
                          className="object-cover"
                          onError={() => {
                            toast({
                              variant: "destructive",
                              title: "Image Error",
                              description: "Failed to load image preview"
                            })
                            if (image) {
                              setImage("")
                            }
                            setImagePreview(null)
                          }}
                        />
                      ) : (
                        <div className="text-center p-4 flex flex-col items-center gap-2">
                          <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                          <p className="text-sm text-muted-foreground">Image preview will appear here</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Display existing images when editing */}
                {currentId && (
                  <div className="mt-6 space-y-3">
                    {renderExistingImages()}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || isUploading}
              >
                {(isSubmitting || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isUploading ? 'Uploading...' : isSubmitting ? (currentId ? 'Updating...' : 'Creating...') : (currentId ? 'Update Entry' : 'Create Entry')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Image reordering dialog */}
        <Dialog open={isReordering} onOpenChange={(open) => !open && setIsReordering(false)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Reorder Images</DialogTitle>
            </DialogHeader>
            
            <div className="py-4">
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop images to change their order. The first image will be used as the main thumbnail.
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {reorderingImages.map((img, idx) => (
                  <div 
                    key={img.id}
                    className={cn(
                      "relative border rounded-md overflow-hidden aspect-video cursor-move",
                      idx === 0 && "ring-2 ring-primary"
                    )}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', idx.toString())
                      setTimeout(() => setIsDragging(true), 0)
                    }}
                    onDragEnd={() => setIsDragging(false)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault()
                      setIsDragging(false)
                      const fromIndex = parseInt(e.dataTransfer.getData('text/plain'))
                      const toIndex = idx
                      if (fromIndex !== toIndex) {
                        moveImage(fromIndex, toIndex)
                      }
                    }}
                  >
                    <Image
                      src={img.url}
                      alt={`Draggable image ${idx + 1}`}
                      fill
                      className={cn(
                        "object-cover transition-opacity",
                        isDragging && "opacity-50"
                      )}
                    />
                    <Badge 
                      variant={idx === 0 ? "default" : "outline"} 
                      className="absolute top-2 left-2"
                    >
                      {idx === 0 ? "Main" : `#${idx + 1}`}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsReordering(false)}
              >
                Cancel
              </Button>
              <Button onClick={saveImageOrder}>
                Save Order
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Delete confirmation dialog */}
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Image</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this image? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDeleteJourneyImage}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                {isDeleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </motion.div>
    </div>
  )
} 