import { createServerSupabaseClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import { type JourneyEntry } from "@/lib/types/journey"

// GET all journey entries
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    
    // First, fetch all journey entries
    const { data: journeyData, error: journeyError } = await supabase
      .from("journey")
      .select("*")
      .order("display_order", { ascending: true })
    
    if (journeyError) {
      console.error("Error fetching journey entries:", journeyError)
      return NextResponse.json(
        { error: "Failed to fetch journey entries" },
        { status: 500 }
      )
    }
    
    if (!journeyData || journeyData.length === 0) {
      return NextResponse.json([])
    }
    
    // Then fetch all images for these journey entries
    const journeyIds = journeyData.map(entry => entry.id)
    
    const { data: imagesData, error: imagesError } = await supabase
      .from("journey_images")
      .select("*")
      .in("journey_id", journeyIds)
      .order("order_index", { ascending: true })
    
    if (imagesError) {
      console.error("Error fetching journey images:", imagesError)
      // Continue without images rather than failing completely
      return NextResponse.json(journeyData.map(entry => ({ ...entry, journey_images: [] })))
    }
    
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
    console.error("Unexpected error fetching journey entries:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}

// Admin-only route to create a new journey entry
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get user session to check if admin
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    const json = await request.json()
    
    // Basic validation
    const { title, subtitle, year, description, skills, icon, color, image_url, display_order } = json
    
    if (!title || !year || !description || !Array.isArray(skills) || !icon || !color || typeof display_order !== 'number') {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }
    
    // First, create the journey entry
    const { data: journeyData, error: journeyError } = await supabase.rpc(
      'create_journey',
      {
        p_title: title,
        p_subtitle: subtitle || null, // Allow null for subtitle
        p_year: year,
        p_description: description,
        p_skills: skills,
        p_icon: icon,
        p_color: color,
        p_display_order: display_order
      }
    )
    
    if (journeyError) {
      console.error("Error creating journey entry:", journeyError)
      return NextResponse.json(
        { error: "Failed to create journey entry" },
        { status: 500 }
      )
    }
    
    // If we have an image URL, add it to the journey
    if (image_url) {
      const { error: imageError } = await supabase.rpc(
        'add_journey_image',
        {
          p_journey_id: journeyData.id,
          p_url: image_url,
          p_order_index: 1
        }
      )
      
      if (imageError) {
        console.error("Error adding journey image:", imageError)
        // Continue without image rather than failing completely
      }
    }
    
    // Return the created entry with its image
    const { data: completeEntry, error: fetchError } = await supabase
      .from("journey")
      .select(`
        *,
        journey_images (*)
      `)
      .eq("id", journeyData.id)
      .single()
      
    if (fetchError) {
      console.error("Error fetching complete journey entry:", fetchError)
      // Return the basic journey data even if we can't fetch the complete entry
      return NextResponse.json(journeyData)
    }
    
    return NextResponse.json(completeEntry)
  } catch (error) {
    console.error("Unexpected error creating journey entry:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
} 