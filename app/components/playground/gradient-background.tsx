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
        "rgba(6, 95, 70, 0.15)", // green
        "rgba(124, 45, 18, 0.15)", // orange
      ]
    : [
        "rgba(167, 139, 250, 0.15)", // light purple
        "rgba(96, 165, 250, 0.15)", // light blue
        "rgba(52, 211, 153, 0.15)", // light green
        "rgba(251, 146, 60, 0.15)", // light orange
      ]

  return (
    <div className="relative w-full h-full overflow-hidden">
      {colors.map((color, index) => (
        <motion.div
          key={index}
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at ${30 * index}% ${20 * (index + 1)}%, ${color} 0%, transparent 50%)`,
            zIndex: index,
          }}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0.5, 0.8, 0.5],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
            delay: index * 2,
            ease: "easeInOut",
          }}
          aria-hidden="true"
        />
      ))}

      {/* Add subtle noise texture overlay */}
      <div
        className="absolute inset-0 opacity-20 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
        aria-hidden="true"
      />
    </div>
  )
}

