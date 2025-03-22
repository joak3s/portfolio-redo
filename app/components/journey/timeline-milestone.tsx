"use client"

import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import type { Milestone } from "@/data/journey-milestones"

interface TimelineMilestoneProps {
  milestone: Milestone
}

export default function TimelineMilestone({ milestone }: TimelineMilestoneProps) {
  return (
    <div className="space-y-6">
      <div>
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold mb-2"
        >
          {milestone.title}
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground"
        >
          {milestone.date}
        </motion.p>
      </div>

      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-lg leading-relaxed"
      >
        {milestone.description}
      </motion.p>

      {milestone.skills && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap gap-2"
        >
          {milestone.skills.map((skill: string, index: number) => (
            <Badge key={index} variant="secondary">
              {skill}
            </Badge>
          ))}
        </motion.div>
      )}

      {milestone.achievements && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-2"
        >
          <h3 className="font-semibold">Key Achievements</h3>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            {milestone.achievements.map((achievement: string, index: number) => (
              <li key={index}>{achievement}</li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  )
} 