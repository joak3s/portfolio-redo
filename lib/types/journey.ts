export interface Milestone {
  title: string
  year: string
  description: string
  skills: string[]
  icon: string
  color: string
  image: string
}

export interface JourneyMilestone {
  id: string
  title: string
  year: string
  description: string
  skills: string[]
  icon: string
  color: string
  image: string
  order: number
  created_at: string
} 