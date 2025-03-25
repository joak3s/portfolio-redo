"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useTheme } from "next-themes"
import ParticleBackground from "@/components/playground/particle-background"
import GradientBackground from "@/components/playground/gradient-background"
import EffectToggle from "@/components/playground/effect-toggle"
import StreamingText from "../../components/playground/streaming-text"
import StreamingTextSubtle from "../../components/playground/streaming-text-subtle"
import { Testimonials } from '../../components/Testimonials'
import { ProjectCarousel } from '@/components/project-carousel'
import { Project } from '@/lib/types'

export default function PlaygroundPage() {
  const [currentEffect, setCurrentEffect] = useState<"particles" | "gradient">("particles")
  const [mounted, setMounted] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const { theme } = useTheme()

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects')
        if (!response.ok) throw new Error('Failed to fetch projects')
        const data = await response.json()
        setProjects(data)
      } catch (error) {
        console.error('Error fetching projects:', error)
      }
    }

    fetchProjects()
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full overflow-hidden">
      {/* Background Effect */}
      <div className="absolute inset-0 -z-10">
        {currentEffect === "particles" ? <ParticleBackground /> : <GradientBackground />}
      </div>

      {/* Content */}
      <div className="container relative z-10 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ maxWidth: '56rem', margin: '0 auto' }}
        >
          <h1 className="text-4xl font-bold mb-6">Interactive Playground</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Explore different visual effects and interactions. Toggle between background styles to see how they
            transform the page.
          </p>

          <div className="mb-12">
            <EffectToggle currentEffect={currentEffect} onChange={(effect) => setCurrentEffect(effect)} />
          </div>

          {/* Project Carousel Demo */}
          <div className="mb-16 bg-background/80 backdrop-blur-sm p-8 rounded-lg border shadow-sm">
            <h2 className="text-2xl font-semibold mb-6 text-center">Project Carousel Demo</h2>
            <ProjectCarousel projects={projects} />
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="bg-background/80 backdrop-blur-sm p-6 rounded-lg border shadow-sm">
              <h2 className="text-2xl font-semibold mb-4">About This Page</h2>
              <p className="mb-4">
                This playground demonstrates dynamic background effects that adapt to your theme preference.
              </p>
              <p>
                The effects are built using React Particles and Framer Motion, showcasing how interactive elements can
                enhance the user experience while maintaining accessibility.
              </p>
            </div>

            <div className="bg-background/80 backdrop-blur-sm p-6 rounded-lg border shadow-sm">
              <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
              <p className="mb-4">
                The particle effect creates an interactive canvas of moving dots that respond to your cursor movements.
              </p>
              <p>
                The gradient effect uses Framer Motion to animate smooth color transitions that complement both light
                and dark themes.
              </p>
            </div>
          </div>

          <div className="mt-16 bg-background/80 backdrop-blur-sm p-8 rounded-lg border shadow-sm">
            <h2 className="text-2xl font-semibold mb-6 text-center">Streaming Text Animations</h2>
            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-center text-muted-foreground">Dynamic Reveal</h3>
                <StreamingText />
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-center text-muted-foreground">Subtle Fade</h3>
                <StreamingTextSubtle />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <Testimonials />
    </div>
  )
}

