"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { HomeCarouselSection } from "@/components/home-carousel-section"
import { useProjects } from "@/hooks/use-projects"
import { AISimpleChat } from '@/components/AIChat'

export default function Home() {
  const { projects, isLoading } = useProjects()

  return (
    <div>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-4xl mx-auto mb-8"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            I&apos;m Jordan Oakes, a<br />
            UX Designer and AI Specialist
          </h1>
          <p className="text-xl text-muted-foreground">Ask my personal AI assistant about me!</p>
        </motion.div>
        
        <div className="w-full max-w-2xl mx-auto mb-16">
          <AISimpleChat />
        </div>
      </div>

    </div>
  )
}

