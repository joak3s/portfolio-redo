import { useState, useEffect } from "react"
import { supabaseClient } from "@/lib/supabase-browser"
import type { Milestone } from "@/lib/types/journey"
import type { Database } from "@/lib/types/supabase"

type JourneyMilestone = Database['public']['Tables']['journey_milestones']['Row']

export function useJourneyMilestones() {
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMilestones = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const { data, error: supabaseError } = await supabaseClient
          .from('journey_milestones')
          .select('*')
          .order('display_order', { ascending: true })
        
        if (supabaseError) throw new Error(supabaseError.message)
        
        // Transform data to match Milestone type
        const formattedMilestones = (data || []).map((milestone: JourneyMilestone) => ({
          title: milestone.title,
          year: milestone.year,
          description: milestone.description,
          skills: milestone.skills,
          icon: milestone.icon,
          color: milestone.color,
          image: milestone.image
        }))
        
        setMilestones(formattedMilestones)
      } catch (err) {
        console.error("Error fetching milestones:", err)
        setError(err instanceof Error ? err.message : "An unknown error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    fetchMilestones()
  }, [])

  return { milestones, isLoading, error }
} 