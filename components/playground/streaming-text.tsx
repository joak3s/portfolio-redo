'use client'

import { motion, Variants } from 'framer-motion'
import { useEffect, useState } from 'react'

const letterVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      delay: custom * 0.1 + 0.5, // Base delay of 0.5s plus stagger
      ease: [0.23, 1, 0.32, 1],
    },
  }),
}

export default function StreamingText() {
  const [isVisible, setIsVisible] = useState(false)
  const letters = 'OAKES'.split('')

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div className="flex items-center justify-center py-8">
      <div className="flex items-baseline text-4xl md:text-5xl lg:text-6xl font-bold">
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: isVisible ? 1 : 0 }}
          transition={{ 
            duration: 0.4,
            ease: [0.23, 1, 0.32, 1]
          }}
          className="text-primary"
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
              style={{
                opacity: 0, // Start fully transparent
              }}
            >
              {letter}
            </motion.span>
          ))}
        </div>
      </div>
    </div>
  )
} 