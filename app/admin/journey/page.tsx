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
import { Loader2, Plus, Edit, Trash2, X, ArrowLeft, Upload, Image as ImageIcon, MoreHorizontal, Check } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { supabaseClient } from "@/lib/supabase-browser"
import { createJourneyEntry, updateJourneyEntry, deleteJourneyEntry } from "@/app/actions/journey-milestone"
import Image from "next/image"
import type { JourneyEntry } from "@/lib/types/journey"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { z } from "zod"

export default function AdminJourneyPage() {
  const [journeyEntries, setJourneyEntries] = useState<JourneyEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("general")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { toast } = useToast()
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Fetch journey entries
  useEffect(() => {
    fetchJourneyEntries()
  }, [])

  const resetForm = () => {
    setTitle("")
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

      const { data, error: fetchError } = await supabaseClient
        .from("journey")
        .select("*")
        .order("display_order", { ascending: true })

      if (fetchError) throw new Error(fetchError.message)

      // Now fetch all images for these journey entries
      const journeyIds = data.map(entry => entry.id)
      
      let journeyImages: Record<string, any[]> = {}
      
      if (journeyIds.length > 0) {
        const { data: imagesData, error: imagesError } = await supabaseClient
          .from("journey_images")
          .select("*")
          .in("journey_id", journeyIds)
          .order("order_index", { ascending: true })
        
        if (imagesError) {
          console.error("Error fetching journey images:", imagesError)
        } else {
          // Group images by journey_id
          journeyImages = (imagesData || []).reduce((acc, image) => {
            if (!acc[image.journey_id]) {
              acc[image.journey_id] = []
            }
            acc[image.journey_id].push(image)
            return acc
          }, {} as Record<string, any[]>)
        }
      }
      
      // Combine journey entries with their images
      const entriesWithImages = data.map(entry => ({
        ...entry,
        journey_images: journeyImages[entry.id] || []
      }))
      
      setJourneyEntries(entriesWithImages)
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
      const result = await deleteJourneyEntry(id)
      
      if (!result.success) {
        throw new Error(result.error || "Failed to delete journey entry")
      }

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
        description: "Failed to delete journey entry."
      })
    }
  }

  const handleCreate = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const handleEdit = (entry: JourneyEntry) => {
    setCurrentId(entry.id)
    setTitle(entry.title)
    setYear(entry.year)
    setDescription(entry.description)
    setSkills(entry.skills || [])
    setIcon(entry.icon)
    setColor(entry.color)
    setDisplayOrder(entry.display_order)
    
    // Set image preview if available
    if (entry.journey_images && entry.journey_images.length > 0) {
      setImagePreview(entry.journey_images[0].url)
    } else {
      setImagePreview(null)
    }
    
    setIsDialogOpen(true)
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
        console.log('Uploading image file first...');
        
        try {
          // Create FormData for the file upload
          const formData = new FormData();
          formData.append('file', imageFile);
          
          // Upload the file to get a URL
          const imageResult = await fetch('/api/upload-image', {
            method: 'POST',
            body: formData,
          });
          
          if (!imageResult.ok) {
            const errorData = await imageResult.json();
            throw new Error(errorData.error || 'Failed to upload image');
          }
          
          const imageData = await imageResult.json();
          uploadedImageUrl = imageData.url;
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
      
      // Extract and format the data (now with uploadedImageUrl instead of imageFile)
      const formData = {
        title,
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
        year: formData.year,
        hasSkills: formData.skills?.length > 0,
        hasImage: !!formData.image_url
      });
      
      let result;
      
      if (currentId) {
        // Update existing entry (no longer passing image_file)
        result = await updateJourneyEntry(currentId, formData);
      } else {
        // Create new entry (no longer passing image_file)
        result = await createJourneyEntry(formData);
      }
      
      if (result.success) {
        toast({
          title: `Journey entry ${currentId ? 'updated' : 'created'} successfully`,
        });
        
        // Reset form and close modal
        resetForm()
        setIsDialogOpen(false)
        
        // Refresh journey list
        fetchJourneyEntries()
      } else {
        console.error('Error saving journey entry:', result.error);
        toast({
          title: `Error saving journey entry: ${result.error}`,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        variant: 'destructive'
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
          <Button onClick={handleCreate} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Entry
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Narrative Arc Structure Guide</CardTitle>
            <CardDescription>
              Create a compelling professional journey with these suggested milestones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Recommended Milestones Structure</h3>
                  <div className="space-y-4 text-sm">
                    <div>
                      <p><strong>1. Beginning (2015):</strong> First Graphic Design Commission</p>
                      <p className="text-muted-foreground text-xs mt-1">Shows your origins in graphic design, establishes your foundation in visual communication, and emphasizes client work experience from the start.</p>
                    </div>
                    <div>
                      <p><strong>2. Educational Foundation (2018):</strong> UC Santa Cruz</p>
                      <p className="text-muted-foreground text-xs mt-1">Highlights your academic credentials, explains the theoretical underpinning of your approach, and links cognitive science to your user-centered design philosophy.</p>
                    </div>
                    <div>
                      <p><strong>3. Transition Point (2020):</strong> Precision Mercedes</p>
                      <p className="text-muted-foreground text-xs mt-1">Marks your pivot from pure graphic design to web experiences, showcases your first significant client presentation, and demonstrates growing technical skills.</p>
                    </div>
                    <div>
                      <p><strong>4. Skill Expansion (2021):</strong> Off The Leash Lifestyle</p>
                      <p className="text-muted-foreground text-xs mt-1">Shows diversification into e-commerce, highlights integration of social media with digital design, and demonstrates growing business acumen with conversion-focused design.</p>
                    </div>
                    <div>
                      <p><strong>5. Professional Growth (2022):</strong> Aletheia Digital Media</p>
                      <p className="text-muted-foreground text-xs mt-1">Career advancement into an agency role, leadership responsibilities and team management, and client portfolio expansion and project management skills.</p>
                    </div>
                    <div>
                      <p><strong>6. Technical Mastery (2023):</strong> Swyvvl Real Estate Platform</p>
                      <p className="text-muted-foreground text-xs mt-1">Full-stack development capabilities, complex project showcasing both design and technical expertise, and positions you as a complete product designer.</p>
                    </div>
                    <div>
                      <p><strong>7. Current Expertise (2024):</strong> AI Integration Specialist</p>
                      <p className="text-muted-foreground text-xs mt-1">Shows your cutting-edge skills in AI integration, demonstrates currency with latest technology trends, and represents the culmination of your journey.</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Why Use a Narrative Arc?</h3>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li>Shows clear professional growth over time</li>
                    <li>Highlights your diverse skill acquisition</li>
                    <li>Creates a compelling story for visitors</li>
                    <li>Demonstrates your intentional career path</li>
                    <li>Makes your experience more memorable</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
                    <TableHead className="w-[100px]">Order</TableHead>
                    <TableHead className="w-[160px]">Image</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Skills</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {journeyEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.display_order}</TableCell>
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
                      <TableCell>
                        <div className="font-medium">{entry.title}</div>
                        <div className="text-sm text-muted-foreground line-clamp-1">{entry.description}</div>
                      </TableCell>
                      <TableCell>{entry.year}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
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
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
      </motion.div>
    </div>
  )
} 