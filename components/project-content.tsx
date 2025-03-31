'use client'

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ChevronLeft, ChevronRight, X } from "lucide-react"
import Link from "next/link"
import type { Project, Tool } from "@/lib/types"
import { Dialog, DialogContent, DialogPortal, DialogOverlay } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { supabaseClient } from "@/lib/supabase-browser"

interface ProjectContentProps {
  slug: string
}

export function ProjectContent({ slug }: ProjectContentProps) {
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)

  useEffect(() => {
    async function fetchProject() {
      try {
        setIsLoading(true)
        
        // Use Supabase client directly instead of API route
        const { data, error: fetchError } = await supabaseClient
          .from('projects')
          .select(`
            *,
            project_images (*),
            tools:project_tools (
              tool:tools (*)
            )
          `)
          .eq('slug', slug)
          .eq('status', 'published')
          .single()
        
        if (fetchError) throw fetchError
        
        if (!data) {
          throw new Error("Project not found")
        }
        
        setProject({
          ...data,
          status: data.status as "published" | "draft" || "draft",
          tools: data.tools?.map((pt: any) => pt.tool).filter(Boolean) || []
        })
      } catch (error) {
        console.error("Error fetching project:", error)
        setError(error instanceof Error ? error.message : "Failed to fetch project")
      } finally {
        setIsLoading(false)
      }
    }

    fetchProject()
  }, [slug, supabaseClient])

  // Image navigation handlers
  const handlePrevious = () => {
    if (selectedImageIndex === null || !project?.project_images) return
    const imageCount = project.project_images.length
    setSelectedImageIndex(
      selectedImageIndex === 0 ? imageCount - 1 : selectedImageIndex - 1
    )
  }

  const handleNext = () => {
    if (selectedImageIndex === null || !project?.project_images) return
    const imageCount = project.project_images.length
    setSelectedImageIndex(
      selectedImageIndex === imageCount - 1 ? 0 : selectedImageIndex + 1
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') handlePrevious()
    if (e.key === 'ArrowRight') handleNext()
    if (e.key === 'Escape') setSelectedImageIndex(null)
  }

  if (isLoading) {
    return (
      <div className="container py-8 md:py-12">
        <div className="animate-pulse space-y-8">
          <div className="h-8 w-48 bg-muted rounded-md" />
          <div className="aspect-video bg-muted rounded-lg" />
          <div className="space-y-4">
            <div className="h-4 w-2/3 bg-muted rounded" />
            <div className="h-4 w-3/4 bg-muted rounded" />
            <div className="h-4 w-1/2 bg-muted rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="container py-8 md:py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Project Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The project you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link href="/work">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  // Prepare images for display
  const projectImages = project.project_images?.map(img => ({
    url: img.url,
    alt: img.alt_text || project.title
  })) || []
  
  // Split images into two groups: first three and the rest
  const firstThreeImages = projectImages.slice(0, 3)
  const remainingImages = projectImages.slice(3)

  return (
    <div className="container py-8 md:py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <Button variant="outline" asChild>
            <Link href="/work">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
            </Link>
          </Button>
        </div>

        <div className="grid gap-8 md:gap-12">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{project.title}</h1>
            <p className="text-lg text-muted-foreground mb-6">{project.description}</p>
            
            <div className="flex flex-wrap gap-2 mb-8">
              {project.tools?.map((tool: Tool) => (
                <Badge key={tool.id} variant="outline">
                  {tool.name}
                </Badge>
              ))}
            </div>

            {project.website_url && (
              <Button asChild className="mb-8">
                <a href={project.website_url} target="_blank" rel="noopener noreferrer">
                  Visit Website
                </a>
              </Button>
            )}
          </div>

          {/* First Three Images - Displayed in three columns */}
          {firstThreeImages.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
              {firstThreeImages.map((image, index) => (
                <div
                  key={`featured-image-${index}`}
                  className="relative aspect-[3/2] overflow-hidden rounded-lg cursor-pointer group"
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <Image
                    src={image.url}
                    alt={image.alt}
                    fill
                    priority={index === 0}
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Project Content */}
          <div className="grid gap-8 md:grid-cols-2">
            {project.challenge && (
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Challenge</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">{project.challenge}</p>
              </div>
            )}
            
            {project.approach && (
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Approach</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">{project.approach}</p>
              </div>
            )}
            
            {project.solution && (
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Solution</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">{project.solution}</p>
              </div>
            )}
            
            {project.results && (
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Results</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">{project.results}</p>
              </div>
            )}
          </div>

          {/* Remaining Images */}
          {remainingImages.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Gallery</h2>
              <div className="grid grid-cols-1 gap-8">
                {remainingImages.map((image, index) => (
                  <div
                    key={`gallery-image-${index}`}
                    className="relative aspect-[3/2] overflow-hidden rounded-lg cursor-pointer group"
                    onClick={() => setSelectedImageIndex(index + 3)} // +3 to account for the first three images
                  >
                    <Image
                      src={image.url}
                      alt={image.alt}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Image Lightbox Dialog */}
      <Dialog
        open={selectedImageIndex !== null}
        onOpenChange={(open) => !open && setSelectedImageIndex(null)}
      >
        <DialogPortal>
          <DialogOverlay />
          <div 
            className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-5xl translate-x-[-50%] translate-y-[-50%] border-none bg-transparent p-0 duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]"
            onKeyDown={handleKeyDown}
          >
            {selectedImageIndex !== null && projectImages[selectedImageIndex] && (
              <div className="relative">
                <div className="relative aspect-[16/9] overflow-hidden rounded-lg">
                  <Image
                    src={projectImages[selectedImageIndex].url}
                    alt={projectImages[selectedImageIndex].alt}
                    fill
                    className="object-contain"
                    priority
                  />
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 text-white bg-black/20 hover:bg-black/40"
                  onClick={() => setSelectedImageIndex(null)}
                >
                  <X className="h-4 w-4" />
                </Button>

                <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 flex justify-between">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white bg-black/20 hover:bg-black/40"
                    onClick={handlePrevious}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white bg-black/20 hover:bg-black/40"
                    onClick={handleNext}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogPortal>
      </Dialog>
    </div>
  )
} 