"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
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
  // State for carousel
  const [isPaused, setIsPaused] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)
  
  // Create Embla Carousel instance with AutoScroll plugin
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: "start" as const,
      skipSnaps: false,
    },
    [
      AutoScroll({
        playOnInit: true,
        stopOnInteraction: true, // Let the plugin handle interaction pausing
        speed: 0.5,
        active: !isPaused, // Control auto-scroll based on paused state
      })
    ]
  )

  // Update scroll states when selection changes
  const updateScrollState = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
    setCanScrollPrev(emblaApi.canScrollPrev())
    setCanScrollNext(emblaApi.canScrollNext())
  }, [emblaApi])

  // Navigation functions
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])
  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi])
  
  // Toggle auto-scroll
  const toggleAutoScroll = useCallback(() => {
    setIsPaused(!isPaused)
  }, [isPaused])

  // Setup event listeners
  useEffect(() => {
    if (!emblaApi) return
    
    // Initial setup
    updateScrollState()
    
    // Setup event listeners
    emblaApi.on("select", updateScrollState)
    emblaApi.on("reInit", updateScrollState)
    
    return () => {
      emblaApi.off("select", updateScrollState)
      emblaApi.off("reInit", updateScrollState)
    }
  }, [emblaApi, updateScrollState])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") scrollPrev()
    if (e.key === "ArrowRight") scrollNext()
    if (e.key === "Space") toggleAutoScroll()
  }

  // Don't render if no projects
  if (!projects.length) return null

  return (
    <div
      className={cn("relative w-full group", className)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Project carousel"
      aria-roledescription="carousel"
    >
      {/* Carousel Container */}
      <div className="overflow-hidden rounded-lg" ref={emblaRef}>
        <div className="flex -mx-2">
          {projects.map((project, index) => {
            const projectImage = project.project_images && project.project_images.length > 0 
              ? project.project_images[0].url 
              : "/placeholder.svg"
              
            return (
              <div
                className="flex-[0_0_90%] sm:flex-[0_0_40%] md:flex-[0_0_30%] lg:flex-[0_0_25%] min-w-0 px-2"
                key={project.id}
                role="group"
                aria-roledescription="slide"
                aria-label={`${index + 1} of ${projects.length}: ${project.title}`}
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

      {/* Navigation Controls */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="absolute inset-0 flex items-center justify-between pointer-events-none">
          {/* Always render buttons but make them conditionally interactive */}
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "ml-2 bg-background/80 backdrop-blur-sm pointer-events-auto transition-all",
              !canScrollPrev && "opacity-50 cursor-not-allowed"
            )}
            onClick={scrollPrev}
            disabled={!canScrollPrev}
            aria-label="Previous project"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous</span>
          </Button>

          <Button
            variant="outline"
            size="icon"
            className={cn(
              "mr-2 bg-background/80 backdrop-blur-sm pointer-events-auto transition-all",
              !canScrollNext && "opacity-50 cursor-not-allowed"
            )}
            onClick={scrollNext}
            disabled={!canScrollNext}
            aria-label="Next project"
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next</span>
          </Button>
        </div>
        
        {/* Play/Pause button */}
        <Button
          variant="outline"
          size="icon"
          className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm pointer-events-auto z-10"
          onClick={toggleAutoScroll}
          aria-label={isPaused ? "Play auto-scroll" : "Pause auto-scroll"}
        >
          {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </Button>
      </div>

      {/* Pagination Indicators */}
      {projects.length > 1 && (
        <div 
          className="flex justify-center gap-2 mt-4"
          role="tablist"
          aria-label="Carousel pagination"
        >
          {Array.from({ length: projects.length }).map((_, index) => (
            <button
              key={index}
              type="button"
              role="tab"
              className={cn(
                "w-2 h-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-primary/50",
                index === selectedIndex ? "bg-primary w-4" : "bg-muted hover:bg-primary/50",
              )}
              onClick={() => scrollTo(index)}
              aria-label={`Go to slide ${index + 1}`}
              aria-selected={index === selectedIndex}
              tabIndex={index === selectedIndex ? 0 : -1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

