import { useState, useEffect } from "react"
import { supabaseClient } from "@/lib/supabase-browser"
import type { Milestone, JourneyEntry } from "@/lib/types/journey"
import type { Database } from "@/lib/types/supabase"

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
        
        // First, fetch all journey entries
        const { data: journeyData, error: journeyError } = await supabaseClient
          .from('journey')
          .select('*')
          .order('display_order', { ascending: true })
        
        if (journeyError) throw new Error(journeyError.message)
        
        if (!journeyData || journeyData.length === 0) {
          setMilestones([])
          return
        }
        
        // Then fetch all images for these entries
        const journeyIds = journeyData.map(entry => entry.id)
        
        const { data: imagesData, error: imagesError } = await supabaseClient
          .from('journey_images')
          .select('*')
          .in('journey_id', journeyIds)
          .order('order_index', { ascending: true })
        
        if (imagesError) {
          console.warn("Error fetching journey images:", imagesError)
          // Continue without images rather than failing completely
        }
        
        // Group images by journey_id
        const imagesByJourneyId = (imagesData || []).reduce((acc, image) => {
          if (!acc[image.journey_id]) {
            acc[image.journey_id] = []
          }
          acc[image.journey_id].push(image)
          return acc
        }, {} as Record<string, any[]>)
        
        // Map the new structure to be compatible with both old and new components
        const compatibleMilestones = journeyData.map((entry) => {
          const images = imagesByJourneyId[entry.id] || [];
          
          // Create a compatible milestone object that satisfies both interfaces
          return {
            // Common properties from both types
            title: entry.title,
            subtitle: entry.subtitle || '', // Include subtitle field with fallback
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