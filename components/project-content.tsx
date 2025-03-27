'use client'

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import type { Project, Tool } from "@/lib/types"
import { ProjectImageGallery } from "@/components/project-image-gallery"
import { cn } from "@/lib/utils"
import { supabaseClient } from "@/lib/supabase-browser"

interface ProjectContentProps {
  slug: string
}

export function ProjectContent({ slug }: ProjectContentProps) {
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

          {/* Project Images */}
          <ProjectImageGallery 
            images={project.project_images?.map(img => ({
              url: img.url,
              alt: img.alt_text || project.title
            })) || []}
            className="mb-8"
          />

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
        </div>
      </motion.div>
    </div>
  )
} 