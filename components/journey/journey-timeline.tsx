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

  // Navigation buttons for year badge
  const NavButtons = () => (
    <div className="flex items-center gap-2">
      {onPrevious && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onPrevious}
          disabled={!hasPrevious}
          className={cn(
            "h-8 w-8 p-0 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors",
            !hasPrevious && "opacity-30 cursor-not-allowed hover:bg-background/80"
          )}
          aria-label="Previous milestone"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}

      <Badge
        variant="secondary"
        className="flex items-center gap-1 text-lg font-bold px-3 py-1 z-10"
      >
        <Calendar className="h-4 w-4" />
        {milestone.year}
      </Badge>

      {onNext && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onNext}
          disabled={!hasNext}
          className={cn(
            "h-8 w-8 p-0 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors",
            !hasNext && "opacity-30 cursor-not-allowed hover:bg-background/80"
          )}
          aria-label="Next milestone"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );

  return (
    <div className="relative">
      <Card
        className="overflow-hidden border shadow-md"
        tabIndex={0}
        aria-label={`Milestone: ${milestone.title} (${milestone.year})`}
      >
        <CardHeader className="pb-0">
          {/* Desktop layout */}
          <div className="hidden md:flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                className={cn("p-2 rounded-full shadow-sm", milestone.color)}
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {getIcon(milestone.icon || "")}
              </motion.div>

              <div>
                <h2 className="text-2xl font-bold text-foreground leading-tight">{milestone.title}</h2>
                {"subtitle" in milestone && (
                  <p className="text-base text-muted-foreground">{String(milestone.subtitle || '')}</p>
                )}
              </div>
            </div>

            <NavButtons />
          </div>

          {/* Mobile layout */}
          <div className="md:hidden flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <motion.div
                className={cn("p-2 rounded-full shadow-sm", milestone.color)}
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {getIcon(milestone.icon || "")}
              </motion.div>

              <div>
                <h2 className="text-xl font-bold text-foreground leading-tight">{milestone.title}</h2>
                {"subtitle" in milestone && (
                  <p className="text-sm text-muted-foreground">{String(milestone.subtitle || '')}</p>
                )}
              </div>
            </div>
            
            {/* Centered year badge on mobile */}
            <div className="flex justify-center mt-2">
              <NavButtons />
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

          {/* Skills badges - desktop shows all, mobile shows only 2 */}
          <div className="absolute bottom-2 left-2 max-w-full">
            {/* Desktop version - all skills */}
            <div className="hidden md:flex gap-2 pb-1 flex-wrap max-w-full">
              {milestone.skills && milestone.skills.map((skill, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="bg-background/70 backdrop-blur-sm text-sm whitespace-nowrap animate-in fade-in-50"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {skill}
                </Badge>
              ))}
            </div>
            
            {/* Mobile version - only 2 skills */}
            <div className="flex md:hidden gap-2 pb-1">
              {milestone.skills && milestone.skills.slice(0, 2).map((skill, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="bg-background/70 backdrop-blur-sm text-sm whitespace-nowrap animate-in fade-in-50"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {skill}
                </Badge>
              ))}
              {milestone.skills && milestone.skills.length > 2 && (
                <Badge
                  variant="outline"
                  className="bg-background/70 backdrop-blur-sm text-sm whitespace-nowrap animate-in fade-in-50"
                  style={{ animationDelay: `100ms` }}
                >
                  +{milestone.skills.length - 2}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <CardContent className="pt-6">
          <p className="text-muted-foreground mb-6 leading-relaxed">{milestone.description}</p>


          {/* Simplified Navigation Indicators */}
          <div className="flex flex-col items-center border-t border-border pt-4 mt-4">
            <div className="text-xs text-muted-foreground mb-2 md:ml-auto ml-0 ">
              <span className="hidden md:inline-block">Use arrow keys to navigate</span>
              <span className="md:hidden">Swipe or tap arrows to navigate</span>
            </div>
            {totalMilestones > 0 && (
              <span className="text-xs text-muted-foreground mb-2">
                {currentIndex + 1} of {totalMilestones}
              </span>
            )}

            <div className="flex gap-1.5 my-2">
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
          </div>
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

