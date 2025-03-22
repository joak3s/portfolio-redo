"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useTheme } from "next-themes"

export default function GradientBackground() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const isDarkMode = theme === "dark"

  // Define gradient colors based on theme
  const colors = isDarkMode
    ? [
        "rgba(76, 29, 149, 0.15)", // purple
        "rgba(30, 58, 138, 0.15)", // blue
        "rgba(6, 95, 70, 0.15)",   // green
        "rgba(124, 45, 18, 0.15)", // orange
      ]
    : [
        "rgba(167, 139, 250, 0.15)", // light purple
        "rgba(96, 165, 250, 0.15)",  // light blue
        "rgba(52, 211, 153, 0.15)",  // light green
        "rgba(251, 146, 60, 0.15)",  // light orange
      ]

  return (
    <div className="fixed inset-0 pointer-events-none">
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-3xl"
        style={{ willChange: 'transform' }}
      >
        {colors.map((color, index) => (
          <motion.div
            key={index}
            className="absolute inset-0"
            style={{
              background: `radial-gradient(
                80% 80% at ${30 * index}% ${20 * (index + 1)}%,
                ${color} 0%,
                transparent 55%
              )`,
              willChange: 'transform, opacity',
            }}
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0.4, 0.7, 0.4],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              repeatType: "reverse",
              delay: index * 1.5,
              ease: "easeInOut",
            }}
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  )
}

