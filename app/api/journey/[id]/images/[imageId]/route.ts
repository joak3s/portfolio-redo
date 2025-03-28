import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"

// GET a specific image
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string, imageId: string } }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const milestoneId = params.id
    const imageId = params.imageId
    
    const { data, error } = await supabase
      .from("journey_milestone_images")
      .select("*")
      .eq("id", imageId)
      .eq("milestone_id", milestoneId)
      .single()
    
    if (error) {
      return NextResponse.json(
        { error: "Image not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}

// PATCH (update) a specific image
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string, imageId: string } }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    const milestoneId = params.id
    const imageId = params.imageId
    const updates = await req.json()
    
    // Validate the image exists and belongs to the milestone
    const { data: existingImage, error: fetchError } = await supabase
      .from("journey_milestone_images")
      .select("id")
      .eq("id", imageId)
      .eq("milestone_id", milestoneId)
      .single()
    
    if (fetchError || !existingImage) {
      return NextResponse.json(
        { error: "Image not found" },
        { status: 404 }
      )
    }
    
    // Update the image
    const { data, error } = await supabase
      .from("journey_milestone_images")
      .update(updates)
      .eq("id", imageId)
      .select()
      .single()
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}

// DELETE a specific image
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string, imageId: string } }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    const milestoneId = params.id
    const imageId = params.imageId
    
    // Validate the image exists and belongs to the milestone
    const { data: existingImage, error: fetchError } = await supabase
      .from("journey_milestone_images")
      .select("id")
      .eq("id", imageId)
      .eq("milestone_id", milestoneId)
      .single()
    
    if (fetchError || !existingImage) {
      return NextResponse.json(
        { error: "Image not found" },
        { status: 404 }
      )
    }
    
    // Delete the image
    const { error } = await supabase
      .from("journey_milestone_images")
      .delete()
      .eq("id", imageId)
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
} 