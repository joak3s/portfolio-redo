"use client"

import { useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useJourneyMilestoneImages, type MilestoneImage } from "@/hooks/use-journey-images"

interface MilestoneImageGalleryProps {
  milestoneId: string
  className?: string
}

export function MilestoneImageGallery({ milestoneId, className }: MilestoneImageGalleryProps) {
  const { images, isLoading, error } = useJourneyMilestoneImages(milestoneId)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  
  if (isLoading) {
    return <div className={cn("flex h-40 items-center justify-center rounded-md bg-muted", className)}>Loading images...</div>
  }
  
  if (error) {
    return <div className={cn("flex h-40 items-center justify-center rounded-md bg-muted text-destructive", className)}>Error: {error}</div>
  }
  
  if (!images.length) {
    return <div className={cn("flex h-40 items-center justify-center rounded-md bg-muted", className)}>No images available</div>
  }
  
  const currentImage = images[currentIndex]
  
  const nextImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length)
  }
  
  const prevImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length)
  }
  
  const openLightbox = () => {
    setLightboxOpen(true)
  }
  
  const closeLightbox = () => {
    setLightboxOpen(false)
  }
  
  return (
    <div className={cn("space-y-3", className)}>
      {/* Main image */}
      <div className="relative aspect-video overflow-hidden rounded-lg">
        <Image
          src={currentImage.url}
          alt={currentImage.alt_text || "Journey milestone image"}
          fill
          className="object-cover cursor-pointer transition-all hover:scale-105"
          onClick={openLightbox}
        />
        
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1.5 text-foreground backdrop-blur-sm transition-colors hover:bg-primary/20"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1.5 text-foreground backdrop-blur-sm transition-colors hover:bg-primary/20"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
      
      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex space-x-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border transition-all",
                index === currentIndex ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/50"
              )}
            >
              <Image
                src={image.url}
                alt={image.alt_text || `Thumbnail ${index + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
      
      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm">
          <div className="relative max-h-screen max-w-screen-lg overflow-hidden">
            <Image
              src={currentImage.url}
              alt={currentImage.alt_text || "Journey milestone image"}
              width={1280}
              height={720}
              className="max-h-screen object-contain"
            />
            
            <button
              onClick={closeLightbox}
              className="absolute right-4 top-4 rounded-full bg-background/80 p-2 text-foreground backdrop-blur-sm transition-colors hover:bg-destructive/20"
              aria-label="Close lightbox"
            >
              <X className="h-6 w-6" />
            </button>
            
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-3 text-foreground backdrop-blur-sm transition-colors hover:bg-primary/20"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-8 w-8" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-3 text-foreground backdrop-blur-sm transition-colors hover:bg-primary/20"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-8 w-8" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 