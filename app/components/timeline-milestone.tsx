"use client"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Briefcase, Code, Layout, MessageSquare, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Milestone } from "@/data/journey-milestones"

interface TimelineMilestoneProps {
  milestone: Milestone
}

export default function TimelineMilestone({ milestone }: TimelineMilestoneProps) {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "briefcase":
        return <Briefcase className="h-6 w-6" />
      case "code":
        return <Code className="h-6 w-6" />
      case "layout":
        return <Layout className="h-6 w-6" />
      case "message-square":
        return <MessageSquare className="h-6 w-6" />
      case "image":
        return <ImageIcon className="h-6 w-6" />
      default:
        return <Briefcase className="h-6 w-6" />
    }
  }

  return (
    <Card className="overflow-hidden border shadow-md">
      <div className="relative aspect-video md:aspect-[2.4/1] overflow-hidden">
        <Image src={milestone.image || "/placeholder.svg"} alt={milestone.title} fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-background/20" />
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-2 mb-2">
            <div className={cn("p-2 rounded-full", milestone.color)}>{getIcon(milestone.icon)}</div>
            <Badge variant="secondary">{milestone.year}</Badge>
          </div>
          <h2 className="text-2xl font-bold text-foreground">{milestone.title}</h2>
        </div>
      </div>
      <CardContent className="pt-6">
        <p className="text-muted-foreground mb-6">{milestone.description}</p>
        <div className="flex flex-wrap gap-2">
          {milestone.skills.map((skill, index) => (
            <Badge key={index} variant="outline">
              {skill}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

