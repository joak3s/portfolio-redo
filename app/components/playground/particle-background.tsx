"use client"

import { useTheme } from "next-themes"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"

interface Particle {
  id: number
  x: number
  y: number
  size: number
  duration: number
  delay: number
}

export function ParticleBackground() {
  const { theme } = useTheme()
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    // Generate random particles
    const newParticles: Particle[] = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2, // Increased size range (2-6px)
      duration: Math.random() * 15 + 15, // Longer duration (15-30s)
      delay: Math.random() * 5,
    }))
    setParticles(newParticles)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className={`absolute rounded-full ${
            theme === 'dark' ? 'bg-white/20' : 'bg-black/10' // Increased opacity
          }`}
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
          }}
          animate={{
            x: [
              `${particle.x}%`,
              `${particle.x + (Math.random() - 0.5) * 40}%`, // Increased movement range
              `${particle.x}%`,
            ],
            y: [
              `${particle.y}%`,
              `${particle.y + (Math.random() - 0.5) * 40}%`, // Increased movement range
              `${particle.y}%`,
            ],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: particle.delay,
          }}
        />
      ))}
    </div>
  )
}

