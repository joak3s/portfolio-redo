'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ProjectCarousel } from "@/components/project-carousel"
import { supabaseClient } from "@/lib/supabase-browser"
import type { Project } from "@/lib/types"

export default function FeaturedPage() {
  const [topFeaturedProjects, setTopFeaturedProjects] = useState<Project[]>([])
  const [remainingProjects, setRemainingProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProjects() {
      try {
        // First fetch all published projects
        const { data: allProjects, error } = await supabaseClient
          .from('projects')
          .select(`
            *,
            project_images (*),
            tools:project_tools (
              tool:tools (*)
            )
          `)
          .eq('status', 'published')
          .order('featured', { ascending: true, nullsFirst: false })

        if (error) throw error

        const formattedProjects = allProjects.map(project => ({
          ...project,
          status: (project.status as "published" | "draft") || "draft",
          tools: project.tools?.map((pt: any) => pt.tool).filter(Boolean) || [],
        }))

        // Split into top 5 featured and remaining projects
        const featured = formattedProjects
          .filter(p => p.featured !== null && p.featured > 0)
          .sort((a, b) => (a.featured || 999) - (b.featured || 999))
          .slice(0, 5)
        
        const remaining = formattedProjects
          .filter(p => !featured.some(f => f.id === p.id))
        
        setTopFeaturedProjects(featured)
        setRemainingProjects(remaining)
      } catch (error) {
        console.error("Error fetching projects:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

  if (loading) {
    return (
      <div className="container py-12">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-12">
      <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
        <h1 className="text-4xl font-bold mb-4">Featured Work</h1>
        <p className="text-muted-foreground mb-8 max-w-2xl">
          Browse through a selection of my featured projects that showcase my expertise in UX design and AI development.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {topFeaturedProjects.map((project, index) => {
            // Determine grid span based on index for 2-row asymmetrical layout
            const spanClasses = [
              "md:col-span-6", // Row 1: First project (half width)
              "md:col-span-6", // Row 1: Second project (half width)
              "md:col-span-4", // Row 2: Third project (one-third width)
              "md:col-span-4", // Row 2: Fourth project (one-third width)
              "md:col-span-4", // Row 2: Fifth project (one-third width)
            ][index]

            // Get the first project image or placeholder
            const projectImage = project.project_images && project.project_images.length > 0 
              ? project.project_images[0].url 
              : "/placeholder.svg"

            return (
              <div 
                key={project.id} 
                className={`${spanClasses} group opacity-0 animate-fade-in-up`}
                style={{ animationDelay: `${index * 0.1 + 0.2}s`, animationFillMode: 'forwards' }}
              >
                <Link href={`/work/${project.slug}`} className="block h-full">
                  <div className="relative overflow-hidden rounded-lg aspect-video mb-4 group-hover:shadow-xl transition-all duration-300">
                    <Image
                      src={projectImage}
                      alt={project.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>

                  <h2 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors duration-300">
                    {project.title}
                  </h2>

                  <p className="text-muted-foreground mb-4 line-clamp-2">{project.description}</p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.tools && project.tools.slice(0, 3).map((tool) => (
                      <Badge key={tool.id} variant="secondary" className="text-xs">
                        {tool.name}
                      </Badge>
                    ))}
                    {project.tools && project.tools.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{project.tools.length - 3} more
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center text-sm font-medium">
                    View Case Study
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              </div>
            )
          })}
        </div>

        {remainingProjects.length > 0 && (
          <>
            <div className="flex items-center space-x-4 mb-8 my-16">
              <div className="h-px flex-1 bg-border"></div>
              <h2 className="text-2xl font-semibold">More Projects</h2>
              <div className="h-px flex-1 bg-border"></div>
            </div>

            <div className="mb-16">
              <ProjectCarousel projects={remainingProjects} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

