"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Project } from "@/lib/types"
import useEmblaCarousel from "embla-carousel-react"
import AutoScroll from "embla-carousel-auto-scroll"

interface ProjectCarouselProps {
  projects: Project[]
  className?: string
}

export function ProjectCarousel({ projects, className }: ProjectCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: "start",
      skipSnaps: false,
    },
    [AutoScroll({ playOnInit: true, stopOnInteraction: true, speed: 0.5 })],
  )

  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([])

  const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return

    onSelect()
    setScrollSnaps(emblaApi.scrollSnapList())
    emblaApi.on("select", onSelect)

    return () => {
      emblaApi.off("select", onSelect)
    }
  }, [emblaApi, onSelect])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      emblaApi?.scrollPrev()
    } else if (e.key === "ArrowRight") {
      emblaApi?.scrollNext()
    }
  }

  return (
    <div
      className={cn("relative w-full", className)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Project carousel"
    >
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {projects.map((project, index) => {
            // Get the first project image or use placeholder
            const projectImage = project.project_images && project.project_images.length > 0 
              ? project.project_images[0].url 
              : "/placeholder.svg"
              
            return (
              <div
                className="flex-[0_0_90%] sm:flex-[0_0_40%] md:flex-[0_0_30%] lg:flex-[0_0_25%] min-w-0 pl-4 first:pl-0"
                key={project.id}
              >
                <Link href={`/work/${project.slug}`}>
                  <Card className="overflow-hidden h-full transition-all hover:shadow-lg dark:hover:shadow-primary/10">
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={projectImage}
                        alt={project.title}
                        fill
                        className="object-cover transition-transform duration-300 hover:scale-105"
                      />
                      {project.featured && project.featured > 0 && (
                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary">Featured</Badge>
                        </div>
                      )}
                    </div>
                    <CardContent className="pt-4">
                      <h3 className="text-lg font-semibold mb-2 line-clamp-1">{project.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            )
          })}
        </div>
      </div>

      {/* Navigation buttons */}
      <Button
        variant="outline"
        size="icon"
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm"
        onClick={() => emblaApi?.scrollPrev()}
        aria-label="Previous project"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm"
        onClick={() => emblaApi?.scrollNext()}
        aria-label="Next project"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Dots indicator */}
      <div className="flex justify-center gap-2 mt-4">
        {scrollSnaps.map((_, index) => (
          <button
            key={index}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              index === selectedIndex ? "bg-primary w-4" : "bg-muted hover:bg-primary/50",
            )}
            onClick={() => scrollTo(index)}
            aria-label={`Go to slide ${index + 1}`}
            aria-current={index === selectedIndex ? "true" : "false"}
          />
        ))}
      </div>
    </div>
  )
}

