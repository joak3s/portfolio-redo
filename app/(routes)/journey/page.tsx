"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-media-query"
import TimelineMilestone from "@/components/journey/timeline-milestone"
import { milestones } from "@/data/journey-milestones"

export default function JourneyPage() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDesktop = useMediaQuery("(min-width: 768px)")

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault()
        if (activeIndex < milestones.length - 1) {
          setDirection(1)
          setActiveIndex((prev) => prev + 1)
        }
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault()
        if (activeIndex > 0) {
          setDirection(-1)
          setActiveIndex((prev) => prev - 1)
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [activeIndex])

  const handleNext = () => {
    if (activeIndex < milestones.length - 1) {
      setDirection(1)
      setActiveIndex((prev) => prev + 1)
    }
  }

  const handlePrev = () => {
    if (activeIndex > 0) {
      setDirection(-1)
      setActiveIndex((prev) => prev - 1)
    }
  }

  const handleDotClick = (index: number) => {
    setDirection(index > activeIndex ? 1 : -1)
    setActiveIndex(index)
  }

  const currentMilestone = milestones[activeIndex]
  if (!currentMilestone) return null

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="container py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-4xl font-bold mb-4">My Journey</h1>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl">
            Explore the key milestones in my professional growth, from my first creative projects to my current work.
          </p>
        </motion.div>

        {/* Timeline Container */}
        <div ref={containerRef} className={cn("relative", isDesktop ? "mb-24" : "mb-12")}>
          {/* Timeline Track */}
          <div
            className={cn(
              "bg-muted/50 relative",
              isDesktop ? "h-1 w-full my-16" : "w-1 h-[600px] absolute left-4 top-0 bottom-0",
            )}
          >
            {/* Timeline Dots */}
            {milestones.map((milestone, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={cn(
                  "absolute transition-all duration-300 rounded-full border-4 border-background",
                  index === activeIndex ? "bg-primary h-6 w-6" : "bg-muted h-4 w-4 hover:bg-primary/50",
                  isDesktop
                    ? `top-1/2 -translate-y-1/2 left-[${(index / (milestones.length - 1)) * 100}%]`
                    : `left-1/2 -translate-x-1/2 top-[${(index / (milestones.length - 1)) * 100}%]`,
                )}
                style={
                  isDesktop
                    ? { left: `${(index / (milestones.length - 1)) * 100}%` }
                    : { top: `${(index / (milestones.length - 1)) * 100}%` }
                }
                aria-label={`Go to milestone: ${milestone.title}`}
                aria-current={index === activeIndex ? "true" : "false"}
              />
            ))}

            {/* Progress Indicator */}
            <div
              className={cn(
                "absolute bg-primary transition-all duration-500 ease-in-out",
                isDesktop ? "h-full top-0" : "w-full left-0",
              )}
              style={
                isDesktop
                  ? { width: `${(activeIndex / (milestones.length - 1)) * 100}%` }
                  : { height: `${(activeIndex / (milestones.length - 1)) * 100}%` }
              }
            />
          </div>

          {/* Milestone Content */}
          <div className={cn("relative", isDesktop ? "mt-24" : "ml-16 mt-0")}>
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={activeIndex}
                custom={direction}
                initial={{
                  opacity: 0,
                  x: direction * 50,
                  y: !isDesktop ? direction * 50 : 0,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  x: direction * -50,
                  y: !isDesktop ? direction * -50 : 0,
                }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                <TimelineMilestone milestone={currentMilestone} />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Controls */}
          <div className={cn("flex items-center justify-between mt-8", isDesktop ? "flex-row" : "flex-col gap-4")}>
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={activeIndex === 0}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex gap-2">
              {milestones.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleDotClick(index)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    index === activeIndex ? "bg-primary w-4" : "bg-muted hover:bg-primary/50",
                  )}
                  aria-label={`Go to milestone ${index + 1}`}
                  aria-current={index === activeIndex ? "true" : "false"}
                />
              ))}
            </div>

            <Button
              variant="outline"
              onClick={handleNext}
              disabled={activeIndex === milestones.length - 1}
              className="flex items-center gap-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

