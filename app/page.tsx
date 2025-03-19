"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronDown } from "lucide-react"
import { HomeCarouselSection } from "@/components/home-carousel-section"
import { useProjects } from "@/hooks/use-projects"
import { ExampleCard } from "@/components/example-card"
import { Container, Grid } from '@mantine/core'

export default function Home() {
  const [message, setMessage] = useState("")
  useProjects()

  const quickPrompts = [
    { text: "Tell me about your case studies", action: () => {} },
    { text: "What is your vision?", action: () => {} },
    { text: "Share your background", action: () => {} },
    { text: "List your skills", action: () => {} },
  ]

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

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-full max-w-2xl mx-auto border rounded-lg p-6 bg-card/30 backdrop-blur"
        >
          <div className="mb-4">
            <Input
              placeholder="Ask me about Jordan..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="bg-background/50"
            />
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {quickPrompts.map((prompt, index) => (
              <Button key={index} variant="outline" className="text-sm bg-background/50" onClick={prompt.action}>
                {prompt.text}
              </Button>
            ))}
          </div>

          <div className="flex justify-end">
            <Button variant="outline" className="text-sm bg-background/50">
              Ask AI Assistant <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </div>

      <Container size="lg" py="xl">
        <Grid>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <ExampleCard />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <ExampleCard />
          </Grid.Col>
        </Grid>
      </Container>
    </div>
  )
}

