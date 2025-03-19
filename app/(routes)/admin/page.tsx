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
import type { Project } from "@/lib/types"
import { Edit, Trash2, Plus, MoreHorizontal, ExternalLink, AlertCircle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from "next/link"
import { FormItem, FormLabel, FormControl } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ProjectImageUpload } from '@/components/project-image-upload'
import { cn } from "@/lib/utils"

export default function AdminPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Partial<Project> | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("general")
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const isMobile = useMediaQuery("(max-width: 768px)")

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch("/api/projects")

      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      setProjects(data)
    } catch (error) {
      console.error("Error fetching projects:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch projects")
      toast({
        title: "Error",
        description: "Failed to fetch projects. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const validateProject = (project: Partial<Project>) => {
    const errors: Record<string, string> = {}

    if (!project?.title?.trim()) {
      errors.title = "Project title is required"
    }

    if (!project?.description?.trim()) {
      errors.description = "Project description is required"
    }

    if (!project?.slug?.trim()) {
      errors.slug = "Slug is required"
    } else if (!/^[a-z0-9-]+$/.test(project.slug)) {
      errors.slug = "Slug must contain only lowercase letters, numbers, and hyphens"
    }

    return errors
  }

  const handleEditProject = (project: Project) => {
    setSelectedProject(project)
    setFormErrors({})
    setIsDialogOpen(true)
  }

  const handleCreateProject = () => {
    setSelectedProject({
      title: "",
      slug: "",
      description: "",
      content: {
        challenge: "",
        approach: "",
        solution: "",
        results: ""
      },
      featured: 0,
      status: "draft",
      images: {
        thumbnail: {
          url: "",
          alt: ""
        },
        gallery: []
      },
      tags: [],
      tools: [],
      websiteUrl: "",
      metadata: {
        priority: 0
      }
    })
    setFormErrors({})
    setIsDialogOpen(true)
    setActiveTab("general")
  }

  const handleSaveProject = async () => {
    if (!selectedProject) return

    const errors = validateProject(selectedProject)
    if (Object.keys(errors).length > 0) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      })
      setFormErrors(errors)
      return
    }

    try {
      if ("id" in selectedProject && selectedProject.id && selectedProject.slug) {
        // Update existing project
        const response = await fetch(`/api/projects/${selectedProject.slug}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(selectedProject),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to update project")
        }

        toast({
          title: "Success",
          description: `${selectedProject.title} has been updated successfully.`,
        })
      } else {
        // Create new project
        const response = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(selectedProject),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to create project")
        }

        toast({
          title: "Success",
          description: `${selectedProject.title} has been created successfully.`,
        })
      }

      fetchProjects()
      setIsDialogOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error saving project:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save project",
        variant: "destructive",
      })
    }
  }

  const handleDeleteProject = async (project: Project) => {
    if (!confirm(`Are you sure you want to delete "${project.title}"? This action cannot be undone.`)) return

    try {
      const response = await fetch(`/api/projects/${project.slug}`, {
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
      router.refresh()
    } catch (error) {
      console.error("Error deleting project:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete project",
        variant: "destructive",
      })
    }
  }

  const handleInputChange = (field: string, value: any) => {
    if (!selectedProject) return

    // Clear the error for this field when the user makes changes
    if (formErrors[field]) {
      setFormErrors({ ...formErrors, [field]: "" })
    }

    setSelectedProject({ ...selectedProject, [field]: value })
  }

  const handleSlugChange = (value: string) => {
    if (!selectedProject) return

    // Auto-generate a slug-friendly value
    const slugified = value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")

    setSelectedProject({ ...selectedProject, slug: slugified })

    // Clear the error for this field
    if (formErrors.slug) {
      setFormErrors({ ...formErrors, slug: "" })
    }
  }

  const sortedProjects = [...projects].sort((a, b) => {
    // Sort by featured value (lower numbers first, 0 at the end)
    if ((a.featured || 999) !== (b.featured || 999)) {
      // If either value is 0, put it at the end
      if (a.featured === 0) return 1
      if (b.featured === 0) return -1
      // Otherwise sort by featured value ascending
      return (a.featured || 999) - (b.featured || 999)
    }
    // Then by publish date
    return new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime()
  })

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
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Featured</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedProjects.map((project) => (
                    <TableRow key={project.id} className="hover:bg-muted/50">
                      <TableCell>
                        {project.images?.thumbnail?.url ? (
                          <div className="relative w-10 h-10 rounded-md overflow-hidden border bg-muted">
                            <img
                              src={project.images.thumbnail.url}
                              alt={project.images.thumbnail.alt || project.title}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center border">
                            <span className="text-muted-foreground text-xs">No img</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{project.title}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground">{project.description}</TableCell>
                      <TableCell>
                        {project.featured > 0 ? (
                          <Badge variant="outline" className="font-mono bg-background">
                            {project.featured.toString().padStart(2, '0')}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline"
                          className={cn(
                            "capitalize border",
                            project.status === 'published' 
                              ? "border-green-500/50 text-green-700 dark:border-green-400/50 dark:text-green-400 hover:bg-green-500/5" 
                              : "border-muted-foreground/20"
                          )}
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
            <div className="md:hidden space-y-4">
              {sortedProjects.map((project) => (
                <Card key={project.id} className="overflow-hidden bg-card">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-start gap-3">
                        {project.images?.thumbnail?.url ? (
                          <div className="relative w-12 h-12 rounded-md overflow-hidden border bg-muted shrink-0">
                            <img
                              src={project.images.thumbnail.url}
                              alt={project.images.thumbnail.alt || project.title}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center border shrink-0">
                            <span className="text-muted-foreground text-xs">No img</span>
                          </div>
                        )}
                        <div>
                          <CardTitle className="leading-tight">{project.title}</CardTitle>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge 
                              variant="outline"
                              className={cn(
                                "capitalize border",
                                project.status === 'published' 
                                  ? "border-green-500/50 text-green-500 dark:border-green-400/50 dark:text-green-400 hover:bg-green-500/5" 
                                  : "border-muted-foreground/20"
                              )}
                            >
                              {project.status}
                            </Badge>
                            {project.featured > 0 && (
                              <Badge variant="outline" className="font-mono bg-background">
                                Featured ({project.featured.toString().padStart(2, '0')})
                              </Badge>
                            )}
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
                          {project.websiteUrl && (
                            <DropdownMenuItem asChild className="hover:bg-muted">
                              <a href={project.websiteUrl} target="_blank" rel="noopener noreferrer">
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
                        <Badge key={tool} variant="outline" className="text-xs bg-background">
                          {tool}
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
                      <Label htmlFor="main_image">Main Image URL</Label>
                      <Input
                        id="main_image"
                        value={selectedProject.images?.thumbnail?.url || ""}
                        onChange={(e) => handleInputChange("images", {
                          ...selectedProject.images,
                          thumbnail: {
                            url: e.target.value,
                            alt: selectedProject.images?.thumbnail?.alt || ""
                          }
                        })}
                        placeholder="/images/project.jpg"
                      />
                      <p className="text-xs text-muted-foreground">Leave as is to use a placeholder image</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="thumbnail_alt">Thumbnail Alt Text</Label>
                      <Input
                        id="thumbnail_alt"
                        value={selectedProject.images?.thumbnail?.alt || ""}
                        onChange={(e) => handleInputChange("images", {
                          ...selectedProject.images,
                          thumbnail: {
                            ...selectedProject.images?.thumbnail,
                            alt: e.target.value
                          }
                        })}
                        placeholder="Enter thumbnail alt text"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="websiteUrl">Website URL</Label>
                      <Input
                        id="websiteUrl"
                        value={selectedProject.websiteUrl || ""}
                        onChange={(e) => handleInputChange("websiteUrl", e.target.value)}
                        placeholder="Enter project website URL"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="content" className="space-y-4 mt-0">
                    <div className="space-y-2">
                      <Label htmlFor="challenge">Challenge</Label>
                      <Textarea
                        id="challenge"
                        value={selectedProject.content?.challenge || ""}
                        onChange={(e) => handleInputChange("content", {
                          ...selectedProject.content,
                          challenge: e.target.value
                        })}
                        placeholder="Describe the project challenge"
                        rows={5}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="approach">Approach</Label>
                      <Textarea
                        id="approach"
                        value={selectedProject.content?.approach || ""}
                        onChange={(e) => handleInputChange("content", {
                          ...selectedProject.content,
                          approach: e.target.value
                        })}
                        placeholder="Describe your approach"
                        rows={5}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="solution">Solution</Label>
                      <Textarea
                        id="solution"
                        value={selectedProject.content?.solution || ""}
                        onChange={(e) => handleInputChange("content", {
                          ...selectedProject.content,
                          solution: e.target.value
                        })}
                        placeholder="Describe the solution"
                        rows={5}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="results">Results</Label>
                      <Textarea
                        id="results"
                        value={selectedProject.content?.results || ""}
                        onChange={(e) => handleInputChange("content", {
                          ...selectedProject.content,
                          results: e.target.value
                        })}
                        placeholder="Describe the results"
                        rows={5}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="details" className="space-y-6 mt-0">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Project Images</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Add up to 5 images for your project. The first image will be used as the thumbnail.
                        </p>

                        {selectedProject.id ? (
                          <ProjectImageUpload
                            projectId={selectedProject.id}
                            images={selectedProject.images?.gallery || []}
                            onImagesUpdate={(newImages) =>
                              handleInputChange("images", {
                                ...selectedProject.images,
                                gallery: newImages,
                                thumbnail: newImages[0] || selectedProject.images?.thumbnail
                              })
                            }
                          />
                        ) : (
                          <div className="text-center py-8 border-2 border-dashed rounded-lg">
                            <p className="text-muted-foreground">
                              Save the project first to enable image uploads
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4 pt-6 border-t">
                        <div className="space-y-2">
                          <Label htmlFor="tools">Tools</Label>
                          <Input
                            id="tools"
                            value={selectedProject.tools ? selectedProject.tools.join(", ") : ""}
                            onChange={(e) =>
                              handleInputChange(
                                "tools",
                                e.target.value
                                  .split(",")
                                  .map((tool) => tool.trim())
                                  .filter(Boolean),
                              )
                            }
                            placeholder="React, Figma, etc."
                          />
                          <p className="text-xs text-muted-foreground">Comma separated list of tools used</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="featured">Featured Order</Label>
                          <Input
                            id="featured"
                            type="number"
                            min={0}
                            max={99}
                            value={selectedProject.featured || 0}
                            onChange={(e) => handleInputChange("featured", parseInt(e.target.value) || 0)}
                            placeholder="0"
                          />
                          <p className="text-xs text-muted-foreground">Lower numbers appear first in featured sections</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="id">Project ID</Label>
                          <Input 
                            id="id" 
                            value={selectedProject.id || "New Project"} 
                            disabled 
                            className="bg-muted text-muted-foreground"
                          />
                        </div>
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

