import { createServerSupabaseClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

interface Params {
  params: {
    id: string
  }
}

export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = params
    
    if (!id) {
      return NextResponse.json(
        { error: "Missing journey ID" },
        { status: 400 }
      )
    }
    
    const supabase = await createServerSupabaseClient()
    
    // Get the session to verify authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    // Fetch the journey entry with its images
    const { data, error } = await supabase
      .from("journey")
      .select(`
        *,
        journey_images (*)
      `)
      .eq("id", id)
      .single()
    
    if (error) {
      console.error("Error fetching journey entry:", error)
      return NextResponse.json(
        { error: "Failed to fetch journey entry" },
        { status: 500 }
      )
    }
    
    if (!data) {
      return NextResponse.json(
        { error: "Journey entry not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error("Unexpected error fetching journey entry:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = params
    
    if (!id) {
      return NextResponse.json(
        { error: "Missing journey ID" },
        { status: 400 }
      )
    }
    
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
    
    // Check if journey entry exists
    const { data: existingJourney, error: fetchError } = await supabase
      .from("journey")
      .select("id")
      .eq("id", id)
      .single()
    
    if (fetchError || !existingJourney) {
      return NextResponse.json(
        { error: "Journey entry not found" },
        { status: 404 }
      )
    }
    
    // Extract fields from the request
    const { title, year, description, skills, icon, color, display_order, images } = json
    
    // Update the journey entry
    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (year !== undefined) updateData.year = year
    if (description !== undefined) updateData.description = description
    if (skills !== undefined) updateData.skills = skills
    if (icon !== undefined) updateData.icon = icon
    if (color !== undefined) updateData.color = color
    if (display_order !== undefined) updateData.display_order = display_order
    
    // Only proceed with update if there are fields to update
    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from("journey")
        .update(updateData)
        .eq("id", id)
      
      if (updateError) {
        console.error("Error updating journey entry:", updateError)
        return NextResponse.json(
          { error: "Failed to update journey entry" },
          { status: 500 }
        )
      }
    }
    
    // Handle images if provided
    if (Array.isArray(images)) {
      // First, delete all existing images
      const { error: deleteImagesError } = await supabase
        .from("journey_images")
        .delete()
        .eq("journey_id", id)
      
      if (deleteImagesError) {
        console.error("Error deleting existing images:", deleteImagesError)
        // Continue anyway, we still want to try adding the new images
      }
      
      // Add the new images
      for (let i = 0; i < images.length; i++) {
        const img = images[i]
        if (img.url) {
          const { error: addImageError } = await supabase.rpc(
            'add_journey_image',
            {
              p_journey_id: id,
              p_url: img.url,
              p_alt_text: img.alt_text || null,
              p_order_index: i
            }
          )
          
          if (addImageError) {
            console.error(`Error adding image ${i}:`, addImageError)
            // Continue with other images even if one fails
          }
        }
      }
    }
    
    // Fetch the updated journey entry with images
    const { data: updatedJourney, error: refetchError } = await supabase
      .from("journey")
      .select(`
        *,
        journey_images (*)
      `)
      .eq("id", id)
      .single()
    
    if (refetchError) {
      console.error("Error fetching updated journey:", refetchError)
      return NextResponse.json(
        { error: "Journey updated but failed to fetch the updated entry" },
        { status: 500 }
      )
    }
    
    return NextResponse.json(updatedJourney)
  } catch (error) {
    console.error("Unexpected error updating journey entry:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id } = params
    
    if (!id) {
      return NextResponse.json(
        { error: "Missing journey ID" },
        { status: 400 }
      )
    }
    
    const supabase = await createServerSupabaseClient()
    
    // Get the session to verify authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    // Delete the journey entry (this will cascade to journey_images due to the FK constraint)
    const { error } = await supabase
      .from("journey")
      .delete()
      .eq("id", id)
    
    if (error) {
      console.error("Error deleting journey entry:", error)
      return NextResponse.json(
        { error: "Failed to delete journey entry" },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Unexpected error deleting journey entry:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
} 