'use client'

import { motion, Variants } from 'framer-motion'
import { useEffect, useState } from 'react'

const letterVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: (custom: number) => ({
    opacity: 1,
    transition: {
      duration: 0.8,
      delay: custom * 0.15 + 0.6, // Longer base delay and slower stagger
      ease: [0.22, 1, 0.36, 1], // Smooth easing curve
    },
  }),
}

interface StreamingTextSubtleProps {
  className?: string;
  textSize?: string;
}

export default function StreamingTextSubtle({ 
  className = "",
  textSize = "text-4xl md:text-5xl lg:text-6xl" 
}: StreamingTextSubtleProps) {
  const [isVisible, setIsVisible] = useState(false)
  const letters = 'OAKES'.split('')

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div className={`flex items-center ${className}`}>
      <div className={`flex items-baseline ${textSize} font-[750] tracking-0.02 dark:text-muted-foreground text-foreground/70`}>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: isVisible ? 1 : 0 }}
          transition={{ 
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1]
          }}
          className="dark:text-primary/90 text-primary/90"
        >
          J
        </motion.span>
        <div className="flex">
          {letters.map((letter, index) => (
            <motion.span
              key={index}
              custom={index}
              variants={letterVariants}
              initial="hidden"
              animate={isVisible ? "visible" : "hidden"}
              className="inline-block"
            >
              {letter}
            </motion.span>
          ))}
        </div>
      </div>
    </div>
  )
} 