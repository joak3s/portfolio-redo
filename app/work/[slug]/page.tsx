"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import type { Project } from "@/lib/types"
import { ProjectImageGallery } from "@/components/project-image-gallery"

export default function ProjectPage({ params }: { params: { slug: string } }) {
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProject() {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/projects/${params.slug}`)
        
        if (!response.ok) {
          throw new Error("Project not found")
        }

        const data = await response.json()
        setProject(data)
      } catch (error) {
        console.error("Error fetching project:", error)
        setError(error instanceof Error ? error.message : "Failed to fetch project")
      } finally {
        setIsLoading(false)
      }
    }

    fetchProject()
  }, [params.slug])

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container py-8 md:py-12"
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
            {project.tools?.map((tool) => (
              <Badge key={tool} variant="outline">
                {tool}
              </Badge>
            ))}
          </div>

          {project.websiteUrl && (
            <Button asChild className="mb-8">
              <a href={project.websiteUrl} target="_blank" rel="noopener noreferrer">
                Visit Website
              </a>
            </Button>
          )}
        </div>

        {/* Project Images */}
        <ProjectImageGallery 
          images={[
            project.images.thumbnail,
            ...(project.images.gallery || [])
          ].filter(img => img.url)}
          className="mb-8"
        />

        {/* Project Content */}
        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Challenge</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">{project.content.challenge}</p>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Approach</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">{project.content.approach}</p>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Solution</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">{project.content.solution}</p>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Results</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">{project.content.results}</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
} 