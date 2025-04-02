"use client"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Briefcase, Code, Layout, MessageSquare, ImageIcon, Hammer, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Milestone } from "@/lib/types/journey"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

interface TimelineMilestoneProps {
  milestone: Milestone
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

  return (
    <div className="relative">
      <Card 
        className="overflow-hidden border shadow-md"
        tabIndex={0}
        aria-label={`Milestone: ${milestone.title} (${milestone.year})`}
      >
        <div className="relative aspect-video md:aspect-[2.4/1] overflow-hidden">
          <Image 
            src={milestone.image || "/placeholder.svg"} 
            alt={`Illustration for ${milestone.title}`} 
            fill 
            className="object-cover transition-transform hover:scale-105 duration-500" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-background/20" />
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center gap-2 mb-2">
              <motion.div 
                className={cn("p-2 rounded-full", milestone.color)}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {getIcon(milestone.icon)}
              </motion.div>
              <Badge variant="secondary">{milestone.year}</Badge>
              {totalMilestones > 0 && (
                <span className="text-xs text-muted-foreground ml-auto">
                  {currentIndex + 1} of {totalMilestones}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-foreground">{milestone.title}</h2>
            {"subtitle" in milestone && (
              <p className="text-sm text-muted-foreground mt-1">{String(milestone.subtitle || '')}</p>
            )}
          </div>
        </div>
        <CardContent className="pt-6">
          <p className="text-muted-foreground mb-6 leading-relaxed">{milestone.description}</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {milestone.skills.map((skill, index) => (
              <Badge key={index} variant="outline" className="animate-in fade-in-50 slide-in-from-bottom-3" style={{ animationDelay: `${index * 50}ms` }}>
                {skill}
              </Badge>
            ))}
          </div>
          
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
              
              <div className="hidden md:flex gap-1.5">
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
      
      {/* Keyboard navigation tooltip */}
      <div className="hidden md:block absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full pt-3">
        <div className="text-xs text-center text-muted-foreground">
          <span className="hidden md:inline-block">Use arrow keys to navigate</span>
        </div>
      </div>
    </div>
  )
}

