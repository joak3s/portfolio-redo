import { createServerSupabaseClient } from "@/lib/supabase-server"
import type { Milestone, JourneyMilestone } from "@/lib/types/journey"

/**
 * Fetches all journey milestones from the database, ordered by year
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