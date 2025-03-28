import { useState, useEffect } from "react"
import { supabaseClient } from "@/lib/supabase-browser"
import type { Database } from "@/lib/types/supabase"

type JourneyMilestoneImage = Database['public']['Tables']['journey_milestone_images']['Row']

export interface MilestoneImage {
  id: string
  url: string
  alt_text: string | null
  order_index: number
}

export function useJourneyMilestoneImages(milestoneId: string | null) {
  const [images, setImages] = useState<MilestoneImage[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!milestoneId) {
      setImages([])
      setIsLoading(false)
      return
    }

    const fetchImages = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const { data, error: supabaseError } = await supabaseClient
          .from('journey_milestone_images')
          .select('*')
          .eq('milestone_id', milestoneId)
          .order('order_index', { ascending: true })
        
        if (supabaseError) throw new Error(supabaseError.message)
        
        // Transform data to match MilestoneImage type
        const formattedImages = (data || []).map((image: JourneyMilestoneImage) => ({
          id: image.id,
          url: image.url,
          alt_text: image.alt_text,
          order_index: image.order_index
        }))
        
        setImages(formattedImages)
      } catch (err) {
        console.error("Error fetching milestone images:", err)
        setError(err instanceof Error ? err.message : "An unknown error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    fetchImages()
  }, [milestoneId])

  return { images, isLoading, error }
} 