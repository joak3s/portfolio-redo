"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Project } from "@/lib/types"
import { cn } from "@/lib/utils"

interface ProjectCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Project data containing title, description, image, and other metadata */
  project: Project
  /** Optional aspect ratio for the card. Defaults to "landscape" */
  aspect?: "landscape" | "square"
  /** Optional width for the card. Defaults to "auto" */
  width?: number
}

/**
 * ProjectCard component displays a project with image, title, and description
 * @component
 * @example
 * ```tsx
 * <ProjectCard
 *   project={{
 *     title: "My Project",
 *     description: "Project description",
 *     images: {
 *       thumbnail: { url: "/path/to/image.jpg", alt: "Project thumbnail" }
 *     }
 *   }}
 *   aspect="landscape"
 * />
 * ```
 */
export default function ProjectCard({
  project,
  aspect = "landscape",
  width,
  className,
  ...props
}: ProjectCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-lg border bg-background",
        className
      )}
      style={{ width }}
      {...props}
    >
      <Link href={`/work/${project.slug}`} className="relative block">
        <div
          className={cn(
            "relative",
            aspect === "landscape" ? "aspect-[16/9]" : "aspect-square"
          )}
        >
          {project.images?.[0] && (
            <Image
              src={project.images[0].url}
              alt={project.images[0].alt || project.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          )}
        </div>
        <div className="absolute inset-0 bg-black/80 p-6 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="flex flex-col h-full justify-end">
            <h3 className="text-xl font-semibold mb-3">{project.title}</h3>
            <p className="text-sm text-gray-100 mb-4 line-clamp-2">{project.description}</p>
            {project.tools && project.tools.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {project.tools.slice(0, 3).map((tool) => (
                  <Badge 
                    key={tool}
                    variant="secondary"
                    className="bg-white/10 text-white hover:bg-white/20"
                  >
                    {tool}
                  </Badge>
                ))}
                {project.tools.length > 3 && (
                  <Badge 
                    variant="secondary"
                    className="bg-white/10 text-white hover:bg-white/20"
                  >
                    +{project.tools.length - 3} more
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  )
}

