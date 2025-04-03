import { createServerSupabaseClient } from "@/lib/supabase-server"
import type { Milestone, JourneyMilestone, JourneyEntry, JourneyImage } from "@/lib/types/journey"

/**
 * Fetches all journey milestones from the database, ordered by year
 * @deprecated Use getJourneyEntries instead
 */
export async function getJourneyMilestones(): Promise<Milestone[]> {
  const supabase = createServerSupabaseClient()
  
  try {
    const { data, error } = await supabase
      .from("journey_milestones")
      .select("*")
      .order("order", { ascending: true })
    
    if (error) {
      console.error("Error fetching journey milestones:", error)
      return []
    }
    
    // Transform the data to match the Milestone type
    return (data || []).map((milestone: JourneyMilestone) => ({
      title: milestone.title,
      year: milestone.year,
      description: milestone.description,
      skills: milestone.skills,
      icon: milestone.icon,
      color: milestone.color,
      image: milestone.image
    }))
  } catch (error) {
    console.error("Error fetching journey milestones:", error)
    return []
  }
}

/**
 * Fetches all journey entries with their images from the database
 */
export async function getJourneyEntries(): Promise<JourneyEntry[]> {
  const supabase = createServerSupabaseClient()
  
  try {
    // Fetch journey entries
    const { data: journeyData, error: journeyError } = await supabase
      .from("journey")
      .select("*")
      .order("display_order", { ascending: true })
    
    if (journeyError) {
      console.error("Error fetching journey entries:", journeyError)
      return []
    }
    
    // Fetch images for all journey entries
    const journeyIds = journeyData.map(entry => entry.id)
    
    if (journeyIds.length === 0) {
      return []
    }
    
    const { data: imagesData, error: imagesError } = await supabase
      .from("journey_images")
      .select("*")
      .in("journey_id", journeyIds)
      .order("order_index", { ascending: true })
    
    if (imagesError) {
      console.error("Error fetching journey images:", imagesError)
      // Continue without images rather than failing completely
    }
    
    // Group images by journey_id
    const imagesByJourneyId = (imagesData || []).reduce((acc, image) => {
      if (!acc[image.journey_id]) {
        acc[image.journey_id] = []
      }
      acc[image.journey_id].push(image)
      return acc
    }, {} as Record<string, JourneyImage[]>)
    
    // Combine journey entries with their images
    return journeyData.map(entry => ({
      ...entry,
      journey_images: imagesByJourneyId[entry.id] || []
    }))
    
  } catch (error) {
    console.error("Error fetching journey entries:", error)
    return []
  }
}

/**
 * Fetches a single journey entry by ID with its images
 */
export async function getJourneyEntryById(id: string): Promise<JourneyEntry | null> {
  const supabase = createServerSupabaseClient()
  
  try {
    // Fetch the journey entry
    const { data: journeyData, error: journeyError } = await supabase
      .from("journey")
      .select("*")
      .eq("id", id)
      .single()
    
    if (journeyError) {
      console.error("Error fetching journey entry:", journeyError)
      return null
    }
    
    // Fetch images for the journey entry
    const { data: imagesData, error: imagesError } = await supabase
      .from("journey_images")
      .select("*")
      .eq("journey_id", id)
      .order("order_index", { ascending: true })
    
    if (imagesError) {
      console.error("Error fetching journey images:", imagesError)
      // Continue without images
    }
    
    // Return the journey entry with its images
    return {
      ...journeyData,
      journey_images: imagesData || []
    }
    
  } catch (error) {
    console.error("Error fetching journey entry by ID:", error)
    return null
  }
} 