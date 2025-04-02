"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useTheme } from "next-themes"
import { Inter } from "next/font/google"
import ParticleBackground from "@/components/playground/particle-background"
import GradientBackground from "@/components/playground/gradient-background"
import EffectToggle from "@/components/playground/effect-toggle"
import StreamingText from "../../components/playground/streaming-text"
import StreamingTextSubtle from "../../components/streaming-text-joakes"
import { Testimonials } from '../../components/testimonials-grid'
import { ProjectCarousel } from '@/components/project-carousel'
import { Project } from '@/lib/types'
import { GlowCard } from "@/components/playground/cards/GlowCard"
import { InteractiveProjectCard } from "@/components/playground/cards/InteractiveProjectCard"
import { demoProject, demoGlowCards } from "@/lib/playground-data"
import { AIChat } from "@/components/playground/ai-chat-demo"

const inter = Inter({ subsets: ["latin"] })

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
          <h1 className="text-4xl font-bold mb-6">Playground</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Explore different visual effects and interactions. Test out components and features.
          </p>
        
          {/* AI Chat Interface */}
          <section className="my-16">

            <AIChat />
          </section>

          {/* Interactive Project Card Section */}
          <section className="mb-16 bg-background/80 backdrop-blur-sm p-8 rounded-lg border shadow-sm">
            <h2 className={`text-3xl font-bold mb-8`}>
              Interactive Project Cards
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <InteractiveProjectCard {...demoProject} />
              <InteractiveProjectCard {...demoProject} />
              <InteractiveProjectCard {...demoProject} />
            </div>
          </section>

          <Testimonials />

          {/* Glow Cards Section */}
          <section className="mb-16 bg-background/80 backdrop-blur-sm p-8 rounded-lg border shadow-sm">
            <h2 className="text-3xl font-bold mb-8">
              Glowing Cards
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {demoGlowCards.map((card, index) => (
                <GlowCard
                  key={index}
                  title={card.title}
                  description={card.description}
                />
              ))}
            </div>
          </section>

          {/* Project Carousel Demo */}
          <div className="mb-16 bg-background/80 backdrop-blur-sm p-8 rounded-lg border shadow-sm">
            <h2 className="text-2xl font-semibold mb-6 text-center">Project Carousel Demo</h2>
            <ProjectCarousel projects={projects} />
          </div>

          <div className="mb-12">
            <EffectToggle currentEffect={currentEffect} onChange={(effect) => setCurrentEffect(effect)} />
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

    </div>
  )
}

