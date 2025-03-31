"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { HomeCarouselSection } from "@/components/home-carousel-section"
import { useProjects } from "@/hooks/use-projects"
import { AISimpleChat } from '@/components/AIChat'

// Client-side only wrapper component
function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) return null
  
  return <>{children}</>
}

export default function Home() {
  const { projects, isLoading } = useProjects()
  const [mounted, setMounted] = useState(false)
  
  // Set mounted state after component mounts
  useEffect(() => {
    setMounted(true)
  }, [])
  
  return (
    <div>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4">
        {/* Show placeholder skeleton during hydration */}
        {!mounted ? (
          <div className="text-center max-w-4xl mx-auto mb-8">
            <div className="h-16 md:h-24 bg-muted/20 rounded-lg mb-4 w-3/4 mx-auto" />
            <div className="h-16 md:h-24 bg-muted/20 rounded-lg mb-4 w-2/3 mx-auto" />
            <div className="h-6 bg-muted/20 rounded-lg w-1/2 mx-auto" />
          </div>
        ) : (
          <ClientOnly>
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
          </ClientOnly>
        )}
        
        <div className="w-full max-w-2xl mx-auto mb-16">
          <AISimpleChat />
        </div>
      </div>
    </div>
  )
}

