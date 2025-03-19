"use client"

import { motion } from "framer-motion"
import { Sparkles, Palette } from "lucide-react"

type EffectType = "particles" | "gradient"

interface EffectToggleProps {
  currentEffect: EffectType
  onChange: (effect: EffectType) => void
}

export default function EffectToggle({ currentEffect, onChange }: EffectToggleProps) {
  return (
    <div className="flex flex-col items-center">
      <div className="text-sm text-muted-foreground mb-3">Select Background Effect</div>
      <div className="bg-background/80 backdrop-blur-sm border rounded-full p-1 flex">
        <button
          onClick={() => onChange("particles")}
          className={`relative flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
            currentEffect === "particles" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
          aria-pressed={currentEffect === "particles"}
          aria-label="Particle effect"
        >
          {currentEffect === "particles" && (
            <motion.div
              layoutId="effect-indicator"
              className="absolute inset-0 bg-primary rounded-full"
              initial={false}
              transition={{ type: "spring", duration: 0.6 }}
            />
          )}
          <span className="relative flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span>Particles</span>
          </span>
        </button>

        <button
          onClick={() => onChange("gradient")}
          className={`relative flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
            currentEffect === "gradient" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
          aria-pressed={currentEffect === "gradient"}
          aria-label="Gradient effect"
        >
          {currentEffect === "gradient" && (
            <motion.div
              layoutId="effect-indicator"
              className="absolute inset-0 bg-primary rounded-full"
              initial={false}
              transition={{ type: "spring", duration: 0.6 }}
            />
          )}
          <span className="relative flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span>Gradient</span>
          </span>
        </button>
      </div>
    </div>
  )
}

