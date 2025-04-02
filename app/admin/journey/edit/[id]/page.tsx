"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, X, ArrowLeft, Upload, Image as ImageIcon, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { supabaseClient } from "@/lib/supabase-browser"
import { uploadImage } from "@/lib/supabase/upload-image"
import Image from "next/image"
import type { JourneyMilestone } from "@/lib/types/journey"

export default function EditJourneyMilestonePage({ params }: { params: { id: string } }) {
  const [milestone, setMilestone] = useState<JourneyMilestone | null>(null)
  const [title, setTitle] = useState("")
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
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchMilestone()
  }, [params.id])

  const fetchMilestone = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabaseClient
        .from("journey_milestones")
        .select("*")
        .eq("id", params.id)
        .single()

      if (fetchError) throw new Error(fetchError.message)

      setMilestone(data as JourneyMilestone)
      
      // Populate form fields
      setTitle(data.title)
      setYear(data.year)
      setDescription(data.description)
      setSkills(data.skills || [])
      setIcon(data.icon)
      setColor(data.color)
      setImage(data.image)
      setImagePreview(data.image) // Set the existing image as the preview
      setDisplayOrder(data.display_order)
    } catch (err) {
      console.error("Error fetching milestone:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch milestone")
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch journey milestone."
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
    
    // Clear direct URL if we're using a file upload
    setImage("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title || !year || !description || skills.length === 0 || !icon || !color || (!image && !imageFile && !imagePreview)) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill out all required fields."
      })
      return
    }

    try {
      setIsSubmitting(true)
      
      // Upload new image if there's one
      let imageUrl = image
      if (imageFile) {
        setIsUploading(true)
        try {
          imageUrl = await uploadImage({ file: imageFile })
        } catch (error: any) {
          toast({
            variant: "destructive",
            title: "Upload failed",
            description: error.message || "Failed to upload image. Please try again."
          })
          setIsUploading(false)
          setIsSubmitting(false)
          return
        }
        setIsUploading(false)
      } else if (imagePreview && !image) {
        // In case we have a preview but no URL (shouldn't happen, but just in case)
        imageUrl = milestone?.image || ""
      }
      
      const { data, error } = await supabaseClient
        .from("journey_milestones")
        .update({
          title,
          year,
          description,
          skills,
          icon,
          color,
          image: imageUrl,
          display_order
        })
        .eq("id", params.id)
        .select()
        .single()
      
      if (error) throw new Error(error.message)
      
      toast({
        title: "Success",
        description: "Journey milestone updated successfully."
      })
      
      router.push("/admin/journey")
    } catch (err) {
      console.error("Error updating journey milestone:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update journey milestone."
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setImage("")
    
    // Reset to original image if preview is removed
    if (milestone) {
      setImagePreview(milestone.image)
    }
  }

  if (isLoading) {
    return (
      <div className="container py-10 flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Loading milestone data...</p>
      </div>
    )
  }
  
  if (error || !milestone) {
    return (
      <div className="container py-10">
        <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4">
          <p>{error || "Milestone not found"}</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/admin/journey")}>
          Back to Journey Milestones
        </Button>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <Button 
        variant="outline" 
        className="mb-6 flex items-center gap-2"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>
      
      <Card>
        <CardHeader>
          <CardTitle>Edit Journey Milestone</CardTitle>
          <CardDescription>Update the details of your journey milestone.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
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
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe this milestone and its significance in your journey. Include: what you did, skills you gained, and how it contributed to your professional growth. For best results, follow the narrative arc structure described in the guide."
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

                {/* Quick add suggested skills based on milestone type */}
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
                        setSkills(["E-commerce", "UI/UX Design", "Social Media Integration", "Brand Strategy"])
                      }}
                    >
                      E-commerce
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                      onClick={() => {
                        setSkills(["Team Leadership", "WordPress", "Client Management", "Project Planning"])
                      }}
                    >
                      Agency
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
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                      onClick={() => {
                        setSkills(["OpenAI Integration", "Vector Databases", "TypeScript", "Supabase", "Modern UI Frameworks"])
                      }}
                    >
                      AI Specialist
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
                <Label htmlFor="image">Milestone Image *</Label>
                
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
                        Choose New Image
                      </Button>
                      
                      {/* Alternative URL input */}
                      <div className="space-y-2">
                        <Label htmlFor="imageUrl" className="text-sm">Or enter image URL directly:</Label>
                        <Input
                          id="imageUrl"
                          value={image}
                          onChange={(e) => {
                            setImage(e.target.value)
                            // If URL is entered, use that instead of the file
                            if (e.target.value) {
                              setImageFile(null)
                              setImagePreview(e.target.value)
                              if (fileInputRef.current) {
                                fileInputRef.current.value = ''
                              }
                            } else if (milestone) {
                              // Reset to original if URL is cleared
                              setImagePreview(milestone.image)
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
                        disabled={isSubmitting || isUploading || (!imageFile && !image && (!imagePreview || imagePreview === milestone?.image))}
                      >
                        <Trash2 className="h-4 w-4" />
                        Reset Image
                      </Button>
                      
                      <p className="text-xs text-muted-foreground">
                        Recommended size: 1200×800px. Max file size: 5MB.
                      </p>
                    </div>
                  </div>
                  
                  {/* Preview area */}
                  <div className="relative border rounded-md overflow-hidden h-[200px] bg-muted/30 flex items-center justify-center">
                    {imagePreview ? (
                      <Image
                        src={imagePreview}
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
                          // Reset to original image if preview fails
                          if (milestone) {
                            setImagePreview(milestone.image)
                          }
                        }}
                      />
                    ) : (
                      <div className="text-center p-4 flex flex-col items-center gap-2">
                        <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">No image available</p>
                      </div>
                    )}
                  </div>
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
                  Order of the milestone (lower numbers appear first)
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || isUploading}>
                {(isSubmitting || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isUploading ? 'Uploading...' : isSubmitting ? 'Updating...' : 'Update Milestone'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 