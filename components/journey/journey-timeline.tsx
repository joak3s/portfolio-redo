"use client"
import Image from "next/image"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Briefcase,
  Code,
  Layout,
  MessageSquare,
  ImageIcon,
  Hammer,
  ChevronLeft,
  ChevronRight,
  Calendar,
  X,
  ZoomIn
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Milestone, JourneyEntry } from "@/lib/types/journey"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog"

interface TimelineMilestoneProps {
  milestone: Milestone | JourneyEntry
  onNext?: () => void
  onPrevious?: () => void
  hasNext?: boolean
  hasPrevious?: boolean
  currentIndex?: number
  totalMilestones?: number
}

export default function TimelineMilestone({
  milestone,
  onNext,
  onPrevious,
  hasNext = false,
  hasPrevious = false,
  currentIndex = 0,
  totalMilestones = 0
}: TimelineMilestoneProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "briefcase":
        return <Briefcase className="h-6 w-6" />
      case "code":
        return <Code className="h-6 w-6" />
      case "layout":
        return <Layout className="h-6 w-6" />
      case "message-square":
        return <MessageSquare className="h-6 w-6" />
      case "image":
        return <ImageIcon className="h-6 w-6" />
      case "tool":
        return <Hammer className="h-6 w-6" />
      default:
        return <Briefcase className="h-6 w-6" />
    }
  }

  // Determine the image URL based on milestone type
  const getImageUrl = (index = 0) => {
    // If it's the new JourneyEntry type with journey_images
    if ('journey_images' in milestone && milestone.journey_images && milestone.journey_images.length > index) {
      return milestone.journey_images[index].url;
    }

    // For legacy Milestone type with direct image property
    if (index === 0 && 'image' in milestone && milestone.image) {
      return milestone.image;
    }

    // Default fallback
    return "/placeholder.svg";
  };

  // Get all images for lightbox
  const getAllImages = () => {
    if ('journey_images' in milestone && milestone.journey_images && milestone.journey_images.length > 0) {
      return milestone.journey_images.map(img => img.url);
    }

    if ('image' in milestone && milestone.image) {
      return [milestone.image];
    }

    return ["/placeholder.svg"];
  };

  const images = getAllImages();

  const openLightbox = (index: number) => {
    setSelectedImageIndex(index);
    setLightboxOpen(true);
  };

  const handleNextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="relative">
      <Card
        className="overflow-hidden border shadow-md"
        tabIndex={0}
        aria-label={`Milestone: ${milestone.title} (${milestone.year})`}
      >
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                className={cn("p-2 rounded-full shadow-sm", milestone.color)}
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {getIcon(milestone.icon)}
              </motion.div>

              <div>
                <h2 className="text-2xl font-bold text-foreground leading-tight">{milestone.title}</h2>
                {"subtitle" in milestone && (
                  <p className="text-base text-muted-foreground">{String(milestone.subtitle || '')}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="flex items-center gap-1 text-lg font-bold px-3 py-1"
              >
                <Calendar className="h-4 w-4" />
                {milestone.year}
              </Badge>

            </div>
          </div>
        </CardHeader>

        <div className="relative aspect-video md:aspect-[16/9] mt-4 overflow-hidden mx-4 rounded-lg border group">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-background/50 backdrop-blur-sm"
            onClick={() => openLightbox(0)}
            aria-label="View image in lightbox"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          <Image
            src={getImageUrl()}
            alt={`Illustration for ${milestone.title}`}
            fill
            className="object-cover transition-transform group-hover:scale-[102%] duration-500 cursor-pointer"
            onClick={() => openLightbox(0)}
          />

          {/* Visual indicator in bottom-right corner */}
          <div className="absolute bottom-2 right-2">
            <Badge variant="outline" className="bg-background/70 backdrop-blur-sm text-xs">
              {milestone.year}
            </Badge>
          </div>
        </div>

        <CardContent className="pt-6">
          <p className="text-muted-foreground mb-6 leading-relaxed">{milestone.description}</p>

          <div className="flex flex-wrap gap-2 mb-4">
            {milestone.skills.map((skill, index) => (
              <Badge
                key={index}
                variant="outline"
                className="animate-in fade-in-50 slide-in-from-bottom-3"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {skill}
              </Badge>
            ))}
          </div>

          {/* Additional Images (for new JourneyEntry type) */}
          {'journey_images' in milestone && milestone.journey_images && milestone.journey_images.length > 1 && (
            <div className="mt-6 mb-4">
              <p className="text-sm font-medium mb-2">Additional images:</p>
              <div className="grid grid-cols-3 gap-2">
                {milestone.journey_images.slice(1).map((image, index) => (
                  <div
                    key={index}
                    className="relative aspect-video rounded-md overflow-hidden border group cursor-pointer"
                    onClick={() => openLightbox(index + 1)}
                  >
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors z-10 flex items-center justify-center">
                      <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <Image
                      src={image.url}
                      alt={`Additional image ${index + 1}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          {(onNext || onPrevious) && (
            <div className="flex justify-between items-center border-t border-border pt-4 mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onPrevious}
                disabled={!hasPrevious}
                className={cn("gap-1", !hasPrevious && "opacity-50 cursor-not-allowed")}
                aria-label="Previous milestone"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only md:not-sr-only">Previous</span>
              </Button>

              <div className="flex-col justify-items-center">
                                
              {totalMilestones > 0 && (
                  <span className="text-xs text-muted-foreground text-center">
                    {currentIndex + 1} of {totalMilestones}
                  </span>
                )}
                <div className="hidden md:flex gap-1.5 my-4">
                  {Array.from({ length: totalMilestones }).map((_, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300",
                        currentIndex === idx ? "w-6 bg-primary" : "w-1.5 bg-muted"
                      )}
                      aria-hidden="true"
                    />
                  ))}
                </div>
    
                <div className="hidden md:block bottom-0 pt-3">
                  <div className="text-xs text-center text-muted-foreground">
                    <span className="hidden md:inline-block">Use arrow keys to navigate</span>
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={onNext}
                disabled={!hasNext}
                className={cn("gap-1", !hasNext && "opacity-50 cursor-not-allowed")}
                aria-label="Next milestone"
              >
                <span className="sr-only md:not-sr-only">Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lightbox Dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-screen-lg p-0 bg-background/95 backdrop-blur-sm">
          <div className="relative h-[80vh] w-full">
            <DialogClose className="absolute top-4 right-4 z-50 rounded-full bg-background/80 p-1.5 backdrop-blur-sm">
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </DialogClose>

            {/* Image Navigation */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-background/50 backdrop-blur-sm"
                  onClick={handlePrevImage}
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-background/50 backdrop-blur-sm"
                  onClick={handleNextImage}
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={selectedImageIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="h-full w-full relative"
              >
                <Image
                  src={images[selectedImageIndex]}
                  alt={`Image ${selectedImageIndex + 1} of ${milestone.title}`}
                  fill
                  className="object-contain"
                  priority
                />
              </motion.div>
            </AnimatePresence>

            {/* Image counter */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
                <Badge variant="secondary" className="bg-background/70 backdrop-blur-sm">
                  {selectedImageIndex + 1} / {images.length}
                </Badge>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

