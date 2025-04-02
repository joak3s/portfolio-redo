"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import type { Project, ProjectCreate, ProjectUpdate, ProjectImage, Tool, Tag } from "@/lib/types"
import { Edit, Trash2, Plus, MoreHorizontal, ExternalLink, AlertCircle, Check, ChevronsUpDown, X, Loader2, MoveUp, MoveDown, ArrowUp, ArrowDown, GripVertical } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { supabaseClient } from "@/lib/supabase-browser"
import { v4 as uuidv4 } from "uuid"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"

export default function AdminPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<ProjectCreate | ProjectUpdate | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("general")
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [tools, setTools] = useState<Tool[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const isMobile = useMediaQuery("(max-width: 768px)")

  useEffect(() => {
    checkAuth()
    fetchProjects()
    fetchTools()
    fetchTags()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { session }, error: authError } = await supabaseClient.auth.getSession()
      if (authError) {
        console.error('Auth check error:', authError)
        toast({
          title: "Authentication Error",
          description: "Please try logging in again",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Auth check error:', error)
    }
  }

  const fetchProjects = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const { data, error: fetchError } = await supabaseClient
        .from('projects')
        .select(`
          *,
          project_images (*),
          tools (*),
          tags (*)
        `)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      
      // Ensure status is properly typed
      const typedProjects = (data || []).map((project: any) => ({
        ...project,
        status: (project.status || 'draft') as 'draft' | 'published'
      })) as Project[]
      
      setProjects(typedProjects)
    } catch (error) {
      console.error("Error fetching projects:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch projects")
      toast({ title: "Error", description: "Failed to fetch projects", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTools = async () => {
    try {
      const { data, error: fetchError } = await supabaseClient
        .from('tools')
        .select('*')
        .order('name')

      if (fetchError) throw fetchError
      setTools(data || [])
    } catch (error) {
      console.error("Error fetching tools:", error)
      toast({ title: "Error", description: "Failed to fetch tools", variant: "destructive" })
    }
  }

  const fetchTags = async () => {
    try {
      const { data, error: fetchError } = await supabaseClient
        .from('tags')
        .select('*')
        .order('name')

      if (fetchError) throw fetchError
      setTags(data || [])
    } catch (error) {
      console.error("Error fetching tags:", error)
      toast({ title: "Error", description: "Failed to fetch tags", variant: "destructive" })
    }
  }

  const validateProject = (project: ProjectCreate | ProjectUpdate) => {
    const errors: Record<string, string> = {}
    if (!project?.title?.trim()) errors.title = "Title is required"
    if (!project?.description?.trim()) errors.description = "Description is required"
    if (!project?.slug?.trim()) errors.slug = "Slug is required"
    else if (!/^[a-z0-9-]+$/.test(project.slug)) {
      errors.slug = "Slug must contain only lowercase letters, numbers, and hyphens"
    }
    return errors
  }

  const handleEditProject = (project: Project) => {
    const projectUpdate: ProjectUpdate = {
      id: project.id,
      title: project.title,
      description: project.description,
      slug: project.slug,
      challenge: project.challenge || '',
      approach: project.approach || '',
      solution: project.solution || '',
      results: project.results || '',
      featured: project.featured || 0,
      status: project.status,
      website_url: project.website_url || '',
      priority: project.priority || 0,
      images: project.project_images?.map(img => ({
        url: img.url,
        alt_text: img.alt_text || '',
        order_index: img.order_index
      })) || [],
      tool_ids: project.tools?.map(tool => tool.id) || [],
      tag_ids: project.tags?.map(tag => tag.id) || []
    }
    setSelectedProject(projectUpdate)
    setFormErrors({})
    setIsDialogOpen(true)
    setActiveTab("general")
  }

  const handleCreateProject = () => {
    const newProject: ProjectCreate = {
      title: "",
      slug: "",
      description: "",
      challenge: "",
      approach: "",
      solution: "",
      results: "",
      featured: 0,
      status: "draft",
      website_url: "",
      priority: 0,
      images: [],
      tool_ids: [],
      tag_ids: []
    }
    setSelectedProject(newProject)
    setFormErrors({})
    setIsDialogOpen(true)
    setActiveTab("general")
  }

  const handleSaveProject = async () => {
    if (!selectedProject) return

    const errors = validateProject(selectedProject)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSaving(true)
      const isUpdate = 'id' in selectedProject
      
      // Create a sanitized copy of the project with cleaned data
      const sanitizedProject = { ...selectedProject };
      
      // Ensure images exists and is valid
      sanitizedProject.images = sanitizedProject.images || [];
      sanitizedProject.images = sanitizedProject.images
        .filter(img => img && typeof img === 'object' && img.url)
        .map((img, index) => ({
          url: img.url,
          alt_text: img.alt_text || '',
          order_index: img.order_index !== undefined ? img.order_index : index
        }));
      
      // Ensure tool_ids exists and is valid
      sanitizedProject.tool_ids = sanitizedProject.tool_ids || [];
      sanitizedProject.tool_ids = sanitizedProject.tool_ids
        .filter(id => id && typeof id === 'string');
      
      // Ensure tag_ids exists and is valid
      sanitizedProject.tag_ids = sanitizedProject.tag_ids || [];
      sanitizedProject.tag_ids = sanitizedProject.tag_ids
        .filter(id => id && typeof id === 'string');
      
      // Handle featured order uniqueness
      if ((sanitizedProject.featured || 0) > 0) {
        // Find all projects that need to be updated due to featured order conflict
        const featuredValue = sanitizedProject.featured || 0;
        const projectsToUpdate = projects.filter(p => 
          (p.featured || 0) === featuredValue && 
          (!isUpdate || p.id !== (sanitizedProject as ProjectUpdate).id)
        )
        
        // If we have conflicts, resolve them by updating other projects
        if (projectsToUpdate.length > 0) {
          console.log(`Resolving featured order conflicts for order: ${featuredValue}`)
          
          // Get all featured values currently in use (excluding the current project if it's an update)
          const featuredValues = projects
            .filter(p => (p.featured || 0) > 0 && (!isUpdate || p.id !== (sanitizedProject as ProjectUpdate).id))
            .map(p => p.featured || 0)
            .sort((a, b) => (a || 0) - (b || 0))
          
          // For each project with the same featured value, we need to shift it
          for (const conflictProject of projectsToUpdate) {
            // Find the next available featured value
            let newFeaturedValue = (sanitizedProject.featured || 0) + 1
            while (featuredValues.includes(newFeaturedValue)) {
              newFeaturedValue++
            }
            
            console.log(`Updating project ${conflictProject.id} featured from ${conflictProject.featured} to ${newFeaturedValue}`)
            
            // Update the project in the database
            await fetch(`/api/admin/projects?id=${conflictProject.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: conflictProject.id,
                featured: newFeaturedValue
              })
            })
            
            // Add this value to our used values
            featuredValues.push(newFeaturedValue)
          }
        }
      }
      
      console.log(`${isUpdate ? 'Updating' : 'Creating'} project with ${sanitizedProject.images?.length || 0} images`);
      
      let response;
      
      if (isUpdate) {
        // Get the project ID for update (TypeScript safety)
        const projectId = (sanitizedProject as ProjectUpdate).id;
        
        // Use the API route for updates instead of direct Supabase client
        console.log(`Updating project ${projectId}`);
        response = await fetch(`/api/admin/projects?id=${projectId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sanitizedProject)
        })
      } else {
        // Use the API route for creating new projects
        console.log('Creating new project');
        response = await fetch('/api/admin/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sanitizedProject)
        })
      }
      
      // Check if the response is HTML instead of JSON (error page)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        console.error('Received HTML response instead of JSON');
        throw new Error('Server error: The API returned an HTML error page');
      }
      
      if (!response.ok) {
        // Try to parse error response
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
          throw new Error(`Server error (${response.status}): Could not parse error details`);
        }
        
        const errorMessage = errorData?.error || errorData?.message || 'Unknown server error';
        const errorDetails = errorData?.details ? `: ${errorData.details}` : '';
        throw new Error(`${errorMessage}${errorDetails}`);
      }
      
      // Get the success response
      const data = await response.json();
      console.log('Save successful:', data);

      toast({
        title: "Success",
        description: `${selectedProject.title} has been ${isUpdate ? 'updated' : 'created'} successfully.`,
      })

      setIsDialogOpen(false)
      fetchProjects()
    } catch (error) {
      console.error("Error saving project:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save project",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteProject = async (project: Project) => {
    if (!confirm(`Are you sure you want to delete "${project.title}"?`)) return

    try {
      const response = await fetch(`/api/admin/projects?id=${project.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete project")
      }

      toast({
        title: "Success",
        description: `${project.title} has been deleted successfully.`,
      })

      fetchProjects()
    } catch (error) {
      console.error("Error deleting project:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete project",
        variant: "destructive",
      })
    }
  }

  // New function to toggle project status
  const handleToggleStatus = async (project: Project) => {
    try {
      const newStatus = project.status === 'published' ? 'draft' : 'published'
      
      const response = await fetch(`/api/admin/projects?id=${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: project.id,
          status: newStatus
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to update project status to ${newStatus}`)
      }

      toast({
        title: "Status Updated",
        description: `${project.title} is now ${newStatus === 'published' ? 'published' : 'in draft mode'}.`,
      })

      // Update project status locally to avoid refetching all projects
      setProjects(projects.map(p => 
        p.id === project.id ? { ...p, status: newStatus } : p
      ))
    } catch (error) {
      console.error("Error updating project status:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update project status",
        variant: "destructive",
      })
    }
  }

  const handleInputChange = (field: string, value: any) => {
    if (!selectedProject) return
    if (formErrors[field]) {
      setFormErrors({ ...formErrors, [field]: "" })
    }
    
    // Special handling for featured order to ensure uniqueness
    if (field === "featured" && value > 0) {
      setSelectedProject({ ...selectedProject, [field]: value })
    } else {
      setSelectedProject({ ...selectedProject, [field]: value })
    }
  }

  // New function to handle featured order changes with uniqueness check
  const handleFeaturedOrderChange = (value: number) => {
    if (!selectedProject) return
    
    // If setting to 0 (not featured), just update normally
    if (value === 0) {
      handleInputChange("featured", 0)
      return
    }
    
    // Check if another project already has this featured order
    const projectWithSameOrder = projects.find(p => 
      p.featured === value && 
      (!("id" in selectedProject) || p.id !== selectedProject.id)
    )
    
    // Update the selected project with new featured order
    handleInputChange("featured", value)
    
    // Show toast notification if we're going to reorder
    if (projectWithSameOrder) {
      toast({
        title: "Featured Order Updated",
        description: "Other projects with conflicting order will be adjusted automatically when saved.",
      })
    }
  }

  const handleSlugChange = (value: string) => {
    if (!selectedProject) return
    const slugified = value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
    handleInputChange("slug", slugified)
  }

  const handleImageUpload = async (file: File) => {
    try {
      // Skip explicit auth check - middleware already protects admin routes
      // If we got this far, the user must be authenticated
      
      if (!file) {
        throw new Error('No file selected')
      }

      // Validate file type
      const fileType = file.type.split('/')[1]
      const validTypes = ['jpeg', 'jpg', 'png', 'gif', 'webp']
      if (!validTypes.includes(fileType.toLowerCase())) {
        throw new Error('Invalid file type. Please upload a valid image file.')
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        throw new Error('File size too large. Maximum size is 5MB.')
      }

      // Create unique file path with proper organization
      const timestamp = new Date().getTime()
      const uniqueId = uuidv4()
      const fileExt = file.name.split('.').pop()?.toLowerCase() || fileType
      const fileName = `${timestamp}-${uniqueId}.${fileExt}`
      const filePath = `projects/${fileName}` // Store in projects/ subdirectory

      console.log('Uploading file to Supabase Storage')

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabaseClient.storage
        .from('project-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: `image/${fileExt}`
        })

      if (uploadError) {
        console.error('Storage upload error details:', uploadError)
        
        // Check for specific auth errors
        if (uploadError.message?.includes('auth') || uploadError.message?.includes('Authentication')) {
          // Redirect to login if auth failed
          router.push('/auth/login?returnUrl=/admin')
          throw new Error('Your session has expired. Please login again.')
        }
        
        throw new Error(`Failed to upload image: ${uploadError.message || 'Unknown error'}`)
      }

      if (!uploadData?.path) {
        throw new Error('Upload successful but no path returned')
      }

      // Get the public URL for the uploaded file
      const { data: urlData } = supabaseClient.storage
        .from('project-images')
        .getPublicUrl(uploadData.path)

      if (!urlData?.publicUrl) {
        // If we can't get the public URL, clean up the uploaded file
        await supabaseClient.storage
          .from('project-images')
          .remove([uploadData.path])
        throw new Error('Failed to get public URL')
      }

      // Return the public URL and path
      return {
        url: urlData.publicUrl,
        path: uploadData.path
      }

    } catch (error) {
      console.error('Error in handleImageUpload:', error)
      toast({
        title: "Upload Error",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive"
      })
      return null
    }
  }

  // Helper function to handle image addition to project
  const handleAddImageToProject = async (file: File) => {
    try {
      if (!selectedProject) return

      const uploadResult = await handleImageUpload(file)
      if (!uploadResult) return

      // Create the new image object
      const newImage: { url: string; alt_text: string; order_index: number } = {
        url: uploadResult.url,
        alt_text: file.name.split('.')[0],
        order_index: (selectedProject.images || []).length
      }

      // Update the project's images array
      const newImages: { url: string; alt_text?: string; order_index: number }[] = [...(selectedProject.images || []), newImage]
      // Make sure order_index values are consecutive and zero-based
      newImages.forEach((img: { url: string; alt_text?: string; order_index: number }, idx: number) => {
        img.order_index = idx
      })
      handleInputChange("images", newImages)

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      })

    } catch (error) {
      console.error('Error adding image to project:', error)
      toast({
        title: "Error",
        description: "Failed to add image to project",
        variant: "destructive"
      })
    }
  }

  // Update the drop handler
  const handleImageDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    const file = e.dataTransfer.files?.[0]
    if (file) {
      await handleAddImageToProject(file)
    }
  }

  // Update the file input handler
  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await handleAddImageToProject(file)
    }
  }

  const handleToolsChange = async (toolName: string) => {
    if (!selectedProject) return

    try {
      // First, check if the tool already exists
      let existingTool = tools.find(t => t.name.toLowerCase() === toolName.toLowerCase())
      
      if (!existingTool) {
        // If tool doesn't exist, create it with a slug
        const slug = toolName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        const response = await fetch('/api/admin/tools', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            name: toolName,
            slug: slug
          })
        })
        
        if (!response.ok) {
          throw new Error(`Failed to create tool: ${toolName}`)
        }
        
        const newTool = await response.json()
        setTools(prev => [...prev, newTool as Tool])
        existingTool = newTool
      }

      // Add the tool if it's not already in the project's tools
      if (existingTool && !selectedProject.tool_ids?.includes(existingTool.id)) {
        const newToolIds = [...(selectedProject.tool_ids || []), existingTool.id]
        handleInputChange("tool_ids", newToolIds)
      }
    } catch (error) {
      console.error('Error handling tools:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update tools",
        variant: "destructive"
      })
    }
  }

  const handleRemoveTool = (toolId: string) => {
    if (!selectedProject) return
    const newToolIds = selectedProject.tool_ids?.filter(id => id !== toolId) || []
    handleInputChange("tool_ids", newToolIds)
  }

  const sortedProjects = [...projects].sort((a, b) => {
    if ((a.featured || 0) !== (b.featured || 0)) {
      if (a.featured === 0) return 1
      if (b.featured === 0) return -1
      return (a.featured || 0) - (b.featured || 0)
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container py-8 md:py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold">Project Management</h1>
          <div className="flex flex-col md:flex-row gap-2">
            <Button onClick={handleCreateProject} className="w-full md:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Add Project
            </Button>
            <Button variant="outline" className="w-full md:w-auto" asChild>
              <Link href="/admin/troubleshooting">
                <AlertCircle className="mr-2 h-4 w-4" /> Troubleshooting
              </Link>
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12 border rounded-md bg-muted/10">
            <h3 className="text-lg font-medium mb-2">No projects found</h3>
            <p className="text-muted-foreground mb-6">Get started by creating your first project</p>
            <Button onClick={handleCreateProject}>
              <Plus className="mr-2 h-4 w-4" /> Add Project
            </Button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block rounded-md border bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-muted/50">
                    <TableHead className="w-[160px]"></TableHead>
                    <TableHead className="w-[250px]">Name</TableHead>
                    <TableHead className="w-[450px]">Description</TableHead>
                    <TableHead className="text-center">Featured</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedProjects.map((project) => (
                    <TableRow key={project.id} className="hover:bg-muted/50">
                      <TableCell>
                        {project.project_images && project.project_images.length > 0 ? (
                          <div className="relative w-28 h-16 rounded-md overflow-hidden border bg-muted">
                            <img
                              src={project.project_images[0].url}
                              alt={project.project_images[0].alt_text || project.title}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        ) : (
                          <div className="w-28 h-16 rounded-md border bg-muted flex items-center justify-center">
                            <span className="text-muted-foreground text-sm">No image</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{project.title}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground">{project.description}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center space-x-2">
                          {typeof project.featured === 'number' && project.featured > 0 && (
                            <Badge variant="outline" className="bg-background font-mono">
                              #{project.featured}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant="outline"
                          className={cn(
                            "capitalize cursor-pointer border",
                            project.status === 'published' 
                              ? "border-green-500/50 text-green-700 dark:border-green-400/50 dark:text-green-400 hover:bg-green-500/10" 
                              : "border-muted-foreground/20 hover:bg-muted/50"
                          )}
                          onClick={() => handleToggleStatus(project)}
                        >
                          {project.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => handleEditProject(project)}
                            className="hover:bg-muted"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDeleteProject(project)}
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
            {isMobile && (
              <div className="md:hidden space-y-4">
                {sortedProjects.map((project) => (
                  <Card key={project.id} className="overflow-hidden bg-card">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex items-start gap-3">
                          {project.project_images && project.project_images.length > 0 ? (
                            <div className="relative w-12 h-12 rounded-md overflow-hidden border bg-muted shrink-0">
                              <img
                                src={project.project_images[0].url}
                                alt={project.project_images[0].alt_text || project.title}
                                className="object-cover w-full h-full"
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-md border bg-muted flex items-center justify-center shrink-0">
                              <span className="text-muted-foreground text-sm">No image</span>
                            </div>
                          )}
                          <div>
                            <h3 className="font-medium leading-none">{project.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {typeof project.featured === 'number' && project.featured > 0 && (
                                <Badge variant="outline" className="font-mono bg-background">
                                  #{project.featured}
                                </Badge>
                              )}
                              <Badge 
                                variant="outline"
                                className={cn(
                                  "capitalize cursor-pointer border",
                                  project.status === 'published' 
                                    ? "border-green-500/50 text-green-700 dark:border-green-400/50 dark:text-green-400 bg-green-500/10" 
                                    : "border-muted-foreground/20 bg-muted/30"
                                )}
                                onClick={() => handleToggleStatus(project)}
                              >
                                {project.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="hover:bg-muted">
                              <MoreHorizontal className="h-5 w-5" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover">
                            <DropdownMenuItem onClick={() => handleEditProject(project)} className="hover:bg-muted">
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteProject(project)}
                              className="text-destructive focus:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleStatus(project)}
                              className={project.status === 'published' 
                                ? "text-amber-600 focus:text-amber-600 hover:bg-amber-500/10"
                                : "text-green-600 focus:text-green-600 hover:bg-green-500/10"
                              }
                            >
                              {project.status === 'published' 
                                ? <><X className="mr-2 h-4 w-4" />Unpublish</>
                                : <><Check className="mr-2 h-4 w-4" />Publish</>
                              }
                            </DropdownMenuItem>
                            {project.website_url && (
                              <DropdownMenuItem asChild className="hover:bg-muted">
                                <a href={project.website_url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="mr-2 h-4 w-4" /> Visit Site
                                </a>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                    </CardContent>
                    <CardFooter>
                      <div className="flex flex-wrap gap-1">
                        {project.tools?.slice(0, 3).map((tool) => (
                          <Badge key={tool.id} variant="outline" className="text-xs bg-background">
                            {tool.name}
                          </Badge>
                        ))}
                        {project.tools && project.tools.length > 3 && (
                          <Badge variant="outline" className="text-xs bg-background">
                            +{project.tools.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 sm:p-6 bg-background border-muted">
            <DialogHeader className="px-6 pt-6 sm:px-0 sm:pt-0">
              <DialogTitle>
                {selectedProject && "id" in selectedProject ? "Edit Project" : "Create Project"}
              </DialogTitle>
            </DialogHeader>

            {selectedProject && (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-3 mb-4 bg-muted/50">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="details">Details & Media</TabsTrigger>
                </TabsList>

                <div className="px-6 py-4 sm:px-0 sm:py-0">
                  <TabsContent value="general" className="space-y-4 mt-0 [&_input]:bg-background [&_textarea]:bg-background">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="title" className={formErrors.title ? "text-destructive" : ""}>
                          Title
                        </Label>
                        <Input
                          id="title"
                          value={selectedProject.title || ""}
                          onChange={(e) => handleInputChange("title", e.target.value)}
                          placeholder="Enter project title"
                          className={formErrors.title ? "border-destructive" : ""}
                        />
                        {formErrors.title && <p className="text-sm text-destructive">{formErrors.title}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="slug" className={formErrors.slug ? "text-destructive" : ""}>
                          Slug (URL-friendly name)
                        </Label>
                        <Input
                          id="slug"
                          value={selectedProject.slug || ""}
                          onChange={(e) => handleInputChange("slug", e.target.value)}
                          placeholder="project-slug"
                          className={formErrors.slug ? "border-destructive" : ""}
                        />
                        {formErrors.slug && <p className="text-sm text-destructive">{formErrors.slug}</p>}
                        {!formErrors.slug && (
                          <p className="text-xs text-muted-foreground">
                            Used in URLs: /featured/{selectedProject.slug || "project-slug"}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className={formErrors.description ? "text-destructive" : ""}>
                        Description
                      </Label>
                      <Textarea
                        id="description"
                        value={selectedProject.description || ""}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        placeholder="Enter project description"
                        rows={5}
                        className={formErrors.description ? "border-destructive" : ""}
                      />
                      {formErrors.description && (
                        <p className="text-sm text-destructive">{formErrors.description}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                          <Label htmlFor="tools">Tools</Label>
                          <div className="space-y-4">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className="w-full justify-between"
                                >
                                  <span className="truncate">
                                    Select or add tools...
                                  </span>
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-full p-0">
                                <Command>
                                  <CommandInput placeholder="Search tools..." />
                                  <CommandEmpty>
                                    Press enter to add "{selectedProject?.tools?.map(tool => tool.name).join(", ") || ""}"
                                  </CommandEmpty>
                                  <CommandGroup>
                                    {tools.map((tool) => (
                                      <CommandItem
                                        key={tool.id}
                                        onSelect={() => handleToolsChange(tool.name)}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            selectedProject?.tool_ids?.includes(tool.id)
                                              ? "opacity-100"
                                              : "opacity-0"
                                          )}
                                        />
                                        {tool.name}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </Command>
                              </PopoverContent>
                            </Popover>

                            {/* Display selected tools as badges */}
                            <div className="flex flex-wrap gap-2">
                              {selectedProject?.tools?.map((tool) => (
                                <Badge
                                  key={tool.id}
                                  variant="secondary"
                                  className="flex items-center gap-1"
                                >
                                  {tool.name}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4 p-0 hover:bg-transparent"
                                    onClick={() => handleRemoveTool(tool.id)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">Select existing tools or type to create new ones</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="featured">Featured Order</Label>
                          <Input
                            id="featured"
                            type="number"
                            min={0}
                            max={99}
                            value={selectedProject.featured || 0}
                            onChange={(e) => handleFeaturedOrderChange(parseInt(e.target.value) || 0)}
                            placeholder="0"
                          />
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className={(selectedProject.featured || 0) > 0 ? "text-amber-500 dark:text-amber-400" : ""}>
                              {(selectedProject.featured || 0) > 0 ? "This project will appear in the featured section" : "0 = Not featured"}
                            </div>
                            {(selectedProject.featured || 0) > 0 && projects.some(p => 
                              (p.featured || 0) === (selectedProject.featured || 0) && 
                              (!("id" in selectedProject) || p.id !== selectedProject.id)
                            ) && (
                              <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                                Will reorder others
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Lower numbers appear first in featured sections. Each featured project must have a unique order number.
                          </p>
                        </div>
                        
                    <div className="space-y-2">
                      <Label htmlFor="website_url">Website URL</Label>
                      <Input
                        id="website_url"
                        value={selectedProject.website_url || ""}
                        onChange={(e) => handleInputChange("website_url", e.target.value)}
                        placeholder="Enter project website URL"
                      />
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="status">Publication Status</Label>
                          <p className="text-xs text-muted-foreground">
                            {selectedProject?.status === 'published' 
                              ? "Project is publicly visible on your portfolio" 
                              : "Project is saved but not publicly visible"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            id="status"
                            checked={selectedProject?.status === 'published'}
                            onCheckedChange={(checked) => {
                              if (selectedProject) {
                                handleInputChange("status", checked ? 'published' : 'draft')
                              }
                            }}
                          />
                          <Badge 
                            variant="outline"
                            className={cn(
                              "capitalize",
                              selectedProject?.status === 'published' 
                                ? "border-green-500/50 text-green-700 dark:text-green-400 bg-green-500/10" 
                                : "border-muted-foreground/20 bg-muted/30"
                            )}
                          >
                            {selectedProject?.status || 'draft'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                  </TabsContent>

                  <TabsContent value="content" className="space-y-4 mt-0">
                    <div className="space-y-2">
                      <Label htmlFor="challenge">Challenge</Label>
                      <Textarea
                        id="challenge"
                        value={selectedProject.challenge || ""}
                        onChange={(e) => handleInputChange("challenge", e.target.value)}
                        placeholder="Describe the project challenge"
                        rows={5}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="approach">Approach</Label>
                      <Textarea
                        id="approach"
                        value={selectedProject.approach || ""}
                        onChange={(e) => handleInputChange("approach", e.target.value)}
                        placeholder="Describe your approach"
                        rows={5}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="solution">Solution</Label>
                      <Textarea
                        id="solution"
                        value={selectedProject.solution || ""}
                        onChange={(e) => handleInputChange("solution", e.target.value)}
                        placeholder="Describe the solution"
                        rows={5}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="results">Results</Label>
                      <Textarea
                        id="results"
                        value={selectedProject.results || ""}
                        onChange={(e) => handleInputChange("results", e.target.value)}
                        placeholder="Describe the results"
                        rows={5}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="details" className="space-y-6 mt-0">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Project Images</Label>
                        <div className="grid gap-6 border rounded-lg p-6 bg-card">
                          {/* Current Images Display */}
                          {(selectedProject?.images || []).length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {(selectedProject?.images || []).map((image, index) => (
                                <div 
                                  key={index} 
                                  className="group relative aspect-video bg-muted rounded-lg overflow-hidden border"
                                >
                                  <img
                                    src={image.url}
                                    alt={image.alt_text || "Project image"}
                                    className="object-cover w-full h-full transition-transform group-hover:scale-105"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      className="h-8"
                                      onClick={() => {
                                        if (!selectedProject?.images) return
                                        const newImages = [...selectedProject.images]
                                        newImages.splice(index, 1)
                                        handleInputChange("images", newImages)
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4 mr-1" />
                                      Remove
                                    </Button>
                                    
                                    <div className="flex gap-1">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 bg-white/20"
                                        onClick={() => {
                                          if (!selectedProject?.images || index === 0) return
                                          const newImages: { url: string; alt_text?: string; order_index: number }[] = [...selectedProject.images]
                                          // Swap with previous image using temp variable to avoid reference error
                                          const temp = newImages[index];
                                          newImages[index] = newImages[index - 1];
                                          newImages[index - 1] = temp;
                                          // Update order_index values
                                          newImages.forEach((img: { url: string; alt_text?: string; order_index: number }, idx: number) => {
                                            img.order_index = idx
                                          })
                                          handleInputChange("images", newImages)
                                        }}
                                        disabled={index === 0}
                                      >
                                        <ArrowUp className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 bg-white/20"
                                        onClick={() => {
                                          if (!selectedProject?.images || index === selectedProject.images.length - 1) return
                                          const newImages: { url: string; alt_text?: string; order_index: number }[] = [...selectedProject.images]
                                          // Swap with next image using temp variable to avoid reference error
                                          const temp = newImages[index];
                                          newImages[index] = newImages[index + 1];
                                          newImages[index + 1] = temp;
                                          // Update order_index values
                                          newImages.forEach((img: { url: string; alt_text?: string; order_index: number }, idx: number) => {
                                            img.order_index = idx
                                          })
                                          handleInputChange("images", newImages)
                                        }}
                                        disabled={index === (selectedProject.images?.length || 0) - 1}
                                      >
                                        <ArrowDown className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/60">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="bg-black/40 text-white text-xs">
                                        #{image.order_index + 1}
                                      </Badge>
                                      <Input
                                        value={image.alt_text || ""}
                                        onChange={(e) => {
                                          if (!selectedProject?.images) return
                                          const newImages = [...selectedProject.images]
                                          newImages[index] = {
                                            ...newImages[index],
                                            alt_text: e.target.value
                                          }
                                          handleInputChange("images", newImages)
                                        }}
                                        placeholder="Alt text for accessibility"
                                        className="h-7 text-sm bg-transparent border-muted-foreground/40"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 border-2 border-dashed rounded-lg">
                              <div className="space-y-2">
                                <div className="mx-auto w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                                  <Plus className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <h3 className="font-medium">No images uploaded</h3>
                                <p className="text-sm text-muted-foreground">
                                  Upload images to showcase your project
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Upload Section */}
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <div className="h-px flex-1 bg-border" />
                              <span className="text-sm text-muted-foreground">Upload New Image</span>
                              <div className="h-px flex-1 bg-border" />
                            </div>
                            
                            <div className="grid gap-4">
                              <div
                                className={cn(
                                  "relative border-2 border-dashed rounded-lg p-4 transition-colors",
                                  "hover:bg-muted/50 cursor-pointer"
                                )}
                                onDragOver={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                }}
                                onDrop={handleImageDrop}
                              >
                                <Input
                                  type="file"
                                  accept="image/*"
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                  onChange={handleFileInputChange}
                                />
                                <div className="text-center space-y-2">
                                  <div className="mx-auto w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                                    <Plus className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-sm font-medium">
                                      Drop an image here or click to upload
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Supports: JPG, PNG, GIF, WebP (max 5MB)
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 pt-6 border-t">

                        {'id' in selectedProject && (
                          <div className="space-y-2">
                            <Label htmlFor="id">Project ID</Label>
                            <Input 
                              id="id" 
                              value={selectedProject.id} 
                              disabled 
                              className="bg-muted text-muted-foreground"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 mt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="w-full sm:w-auto order-2 sm:order-1"
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSaveProject} className="w-full sm:w-auto order-1 sm:order-2 mb-2 sm:mb-0">
                    Save Project
                  </Button>
                </div>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  )
}

