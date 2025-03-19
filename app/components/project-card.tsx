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
  /** Optional aspect ratio for the card. Defaults to "portrait" */
  aspect?: "portrait" | "square"
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
 *     image: "/path/to/image.jpg"
 *   }}
 *   aspect="portrait"
 * />
 * ```
 */
export default function ProjectCard({
  project,
  aspect = "portrait",
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
            aspect === "portrait" ? "aspect-[3/4]" : "aspect-square"
          )}
        >
          {project.image && (
            <Image
              src={project.image}
              alt={project.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          )}
        </div>
        <div className="absolute inset-0 bg-black/60 p-4 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <h3 className="text-lg font-semibold">{project.title}</h3>
          <p className="mt-2 text-sm text-gray-200">{project.description}</p>
        </div>
      </Link>
    </div>
  )
}

