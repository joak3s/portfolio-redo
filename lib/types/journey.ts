// Legacy type for compatibility with old code (if needed)
export interface Milestone {
  title: string
  year: string
  description: string
  skills: string[]
  icon: string
  color: string
  image: string
}

// Legacy type for compatibility with old code (if needed)
export interface JourneyMilestone {
  id: string
  title: string
  year: string
  description: string
  skills: string[]
  icon: string
  color: string
  image: string
  display_order: number
  created_at: string
  updated_at: string
}

// New types for the updated database structure
export interface JourneyImage {
  id: string
  journey_id: string
  url: string
  alt_text?: string | null
  order_index: number
  created_at: string
  updated_at: string
}

export interface JourneyEntry {
  id: string
  title: string
  year: string
  description: string
  skills: string[]
  icon: string
  color: string
  display_order: number
  created_at: string
  updated_at: string
  journey_images?: JourneyImage[]
}

// Types for creating/updating journey entries
export interface JourneyImageCreate {
  url: string
  alt_text?: string | null
  order_index?: number
}

export interface JourneyEntryCreate {
  title: string
  year: string
  description: string
  skills: string[]
  icon: string
  color: string
  display_order: number
  images?: JourneyImageCreate[]
}

export interface JourneyEntryUpdate extends Partial<JourneyEntryCreate> {
  id: string
} 