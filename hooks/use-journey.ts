import { useState, useEffect } from "react"
import { supabaseClient } from "@/lib/supabase-browser"
import type { Milestone, JourneyEntry } from "@/lib/types/journey"
import type { Database } from "@/lib/database.types"

/**
 * Hook to fetch journey entries using the new database structure
 * Returns data that is compatible with both old Milestone and new JourneyEntry types
 */
export function useJourneyMilestones() {
  // Keep the return type as Milestone[] for backward compatibility
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMilestones = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Fetch journey entries using the API endpoint instead of direct client access
        const response = await fetch('/api/journey')
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }
        
        const journeyData = await response.json()
        
        if (!journeyData || journeyData.length === 0) {
          setMilestones([])
          return
        }
        
        // Map the journey entries to milestone format for compatibility
        const compatibleMilestones = journeyData.map((entry: JourneyEntry) => {
          const images = entry.journey_images || [];
          
          // Create a compatible milestone object that satisfies both interfaces
          return {
            // Common properties from both types
            title: entry.title,
            subtitle: entry.subtitle || '', 
            year: entry.year,
            description: entry.description,
            skills: entry.skills,
            icon: entry.icon,
            color: entry.color,
            display_order: entry.display_order,
            
            // Add the image property needed by Milestone type
            // Use the first image URL if available
            image: images.length > 0 ? images[0].url : '',
            
            // Add the journey_images array needed by JourneyEntry
            journey_images: images,
            
            // Include the ID
            id: entry.id
          } as Milestone & Partial<JourneyEntry>;
        });
        
        setMilestones(compatibleMilestones)
      } catch (err) {
        console.error("Error loading journey entries:", err)
        setError(err instanceof Error ? err.message : "Error loading milestones")
      } finally {
        setIsLoading(false)
      }
    }

    fetchMilestones()
  }, [])

  return { milestones, isLoading, error }
} 