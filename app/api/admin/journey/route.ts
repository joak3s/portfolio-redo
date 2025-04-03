import { createServerSupabaseClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get the session to verify authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    // Fetch all journey entries with their images
    const { data, error } = await supabase
      .from("journey")
      .select(`
        *,
        journey_images (*)
      `)
      .order("display_order", { ascending: true })
    
    if (error) {
      console.error("Error fetching journey entries:", error)
      return NextResponse.json(
        { error: "Failed to fetch journey entries" },
        { status: 500 }
      )
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error("Unexpected error fetching journey entries:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get the session to verify authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    // Parse the request body
    const json = await request.json()
    
    // Basic validation
    const { title, year, description, skills, icon, color, display_order, images } = json
    
    if (!title || !year || !description || !Array.isArray(skills) || !icon || !color || typeof display_order !== 'number') {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }
    
    // Use the SQL function to create the journey entry
    const { data: journeyData, error: journeyError } = await supabase.rpc(
      'create_journey',
      {
        p_title: title,
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
        { error: `Failed to create journey entry: ${journeyError.message}` },
        { status: 500 }
      )
    }
    
    // Extract the journey ID from the response
    const journeyId = journeyData.id
    
    // Add images if provided
    if (Array.isArray(images) && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        const img = images[i]
        if (img.url) {
          const { error: imageError } = await supabase.rpc(
            'add_journey_image',
            {
              p_journey_id: journeyId,
              p_url: img.url,
              p_alt_text: img.alt_text || null,
              p_order_index: i
            }
          )
          
          if (imageError) {
            console.error(`Error adding image ${i}:`, imageError)
            // Continue with other images even if one fails
          }
        }
      }
    }
    
    // Fetch the complete journey entry with images
    const { data: completeJourney, error: fetchError } = await supabase
      .from("journey")
      .select(`
        *,
        journey_images (*)
      `)
      .eq("id", journeyId)
      .single()
    
    if (fetchError) {
      console.error("Error fetching complete journey:", fetchError)
      // Return the basic journey data even if we can't fetch the complete entry
      return NextResponse.json(journeyData)
    }
    
    return NextResponse.json(completeJourney)
  } catch (error) {
    console.error("Unexpected error creating journey entry:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
} 