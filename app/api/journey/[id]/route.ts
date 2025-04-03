import { createServerSupabaseClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

// GET a specific journey entry
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    if (!id) {
      return NextResponse.json(
        { error: "Journey ID is required" },
        { status: 400 }
      )
    }
    
    const supabase = await createServerSupabaseClient()
    
    // Fetch the journey entry
    const { data: journeyData, error: journeyError } = await supabase
      .from("journey")
      .select("*")
      .eq("id", id)
      .single()
    
    if (journeyError) {
      console.error(`Error fetching journey entry ${id}:`, journeyError)
      return NextResponse.json(
        { error: "Failed to fetch journey entry" },
        { status: 500 }
      )
    }
    
    if (!journeyData) {
      return NextResponse.json(
        { error: "Journey entry not found" },
        { status: 404 }
      )
    }
    
    // Fetch images for this journey entry
    const { data: imagesData, error: imagesError } = await supabase
      .from("journey_images")
      .select("*")
      .eq("journey_id", id)
      .order("order_index", { ascending: true })
    
    if (imagesError) {
      console.error(`Error fetching images for journey ${id}:`, imagesError)
      // Continue without images rather than failing completely
    }
    
    // Combine the journey entry with its images
    const completeEntry = {
      ...journeyData,
      journey_images: imagesData || []
    }
    
    return NextResponse.json(completeEntry)
  } catch (error) {
    console.error("Unexpected error fetching journey entry:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}

// Update a journey entry (admin only)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    if (!id) {
      return NextResponse.json(
        { error: "Journey ID is required" },
        { status: 400 }
      )
    }
    
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
    const { title, subtitle, year, description, skills, icon, color, display_order, image_url } = json
    
    // Update journey entry
    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (subtitle !== undefined) updateData.subtitle = subtitle
    if (year !== undefined) updateData.year = year
    if (description !== undefined) updateData.description = description
    if (skills !== undefined) updateData.skills = skills
    if (icon !== undefined) updateData.icon = icon
    if (color !== undefined) updateData.color = color
    if (display_order !== undefined) updateData.display_order = display_order
    
    const { data: updatedData, error: updateError } = await supabase
      .from("journey")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()
    
    if (updateError) {
      console.error(`Error updating journey entry ${id}:`, updateError)
      return NextResponse.json(
        { error: "Failed to update journey entry" },
        { status: 500 }
      )
    }
    
    // If we have a new image URL, add it to the journey
    if (image_url) {
      // First get the current highest order_index
      const { data: existingImages, error: fetchError } = await supabase
        .from("journey_images")
        .select("order_index")
        .eq("journey_id", id)
        .order("order_index", { ascending: false })
        .limit(1)
      
      const nextOrderIndex = existingImages && existingImages.length > 0 
        ? existingImages[0].order_index + 1 
        : 1
      
      // Add the new image
      const { error: imageError } = await supabase.rpc(
        'add_journey_image',
        {
          p_journey_id: id,
          p_url: image_url,
          p_order_index: nextOrderIndex
        }
      )
      
      if (imageError) {
        console.error(`Error adding image to journey ${id}:`, imageError)
        // Continue without image rather than failing completely
      }
    }
    
    // Fetch the updated entry with its images
    const { data: completeEntry, error: fetchError } = await supabase
      .from("journey")
      .select(`
        *,
        journey_images (*)
      `)
      .eq("id", id)
      .single()
      
    if (fetchError) {
      console.error(`Error fetching complete updated journey ${id}:`, fetchError)
      // Return the basic updated data if we can't fetch the complete entry
      return NextResponse.json(updatedData)
    }
    
    return NextResponse.json(completeEntry)
  } catch (error) {
    console.error("Unexpected error updating journey entry:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}

// Delete a journey entry (admin only)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    if (!id) {
      return NextResponse.json(
        { error: "Journey ID is required" },
        { status: 400 }
      )
    }
    
    const supabase = await createServerSupabaseClient()
    
    // Get user session to check if admin
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    // First delete any associated images
    const { error: imagesError } = await supabase
      .from("journey_images")
      .delete()
      .eq("journey_id", id)
    
    if (imagesError) {
      console.error(`Error deleting images for journey ${id}:`, imagesError)
      // Continue with deletion even if images deletion fails
    }
    
    // Then delete the journey entry
    const { error: deleteError } = await supabase
      .from("journey")
      .delete()
      .eq("id", id)
    
    if (deleteError) {
      console.error(`Error deleting journey entry ${id}:`, deleteError)
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