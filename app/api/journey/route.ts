import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'

/**
 * GET /api/journey
 * Returns all journey entries with their images
 */
export async function GET(request: Request) {
  try {
    const supabase = await getAdminClient()
    
    // Fetch journey entries
    const { data: journeyData, error: journeyError } = await supabase
      .from('journey')
      .select('*')
      .order('display_order', { ascending: true })
    
    if (journeyError) {
      console.error("Error fetching journey entries:", journeyError)
      return NextResponse.json(
        { error: "Failed to fetch journey entries" },
        { status: 500 }
      )
    }
    
    // If no journeys, return empty array
    if (!journeyData || journeyData.length === 0) {
      return NextResponse.json([])
    }
    
    // Get IDs to fetch images
    const journeyIds = journeyData.map(entry => entry.id)
    
    // Fetch images for all journey entries
    const { data: imagesData, error: imagesError } = await supabase
      .from('journey_images')
      .select('*')
      .in('journey_id', journeyIds)
      .order('order_index', { ascending: true })
    
    // Group images by journey_id
    const imagesByJourneyId = (imagesData || []).reduce((acc, image) => {
      if (!acc[image.journey_id]) {
        acc[image.journey_id] = []
      }
      acc[image.journey_id].push(image)
      return acc
    }, {} as Record<string, any[]>)
    
    // Combine journey entries with their images
    const entriesWithImages = journeyData.map(entry => ({
      ...entry,
      journey_images: imagesByJourneyId[entry.id] || []
    }))
    
    return NextResponse.json(entriesWithImages)
  } catch (error) {
    console.error("Error in journey API:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/journey/:id
 * Returns a single journey entry with its images
 */
export async function POST(request: Request) {
  try {
    const { id } = await request.json()
    
    if (!id) {
      return NextResponse.json(
        { error: "Journey ID is required" },
        { status: 400 }
      )
    }
    
    const supabase = await getAdminClient()
    
    // Fetch journey entry
    const { data, error } = await supabase
      .from('journey')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error("Error fetching journey entry:", error)
      return NextResponse.json(
        { error: "Failed to fetch journey entry" },
        { status: 500 }
      )
    }
    
    // Fetch images for this journey entry
    const { data: imagesData, error: imagesError } = await supabase
      .from('journey_images')
      .select('*')
      .eq('journey_id', id)
      .order('order_index', { ascending: true })
    
    // Return journey with images
    return NextResponse.json({
      ...data,
      journey_images: imagesData || []
    })
  } catch (error) {
    console.error("Error in journey API:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
} 