import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"

// GET all images for a milestone
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const milestoneId = params.id
    
    // Check if milestone exists
    const { data: milestone, error: milestoneError } = await supabase
      .from("journey_milestones")
      .select("id")
      .eq("id", milestoneId)
      .single()
    
    if (milestoneError || !milestone) {
      return NextResponse.json(
        { error: "Milestone not found" },
        { status: 404 }
      )
    }
    
    // Get all images for the milestone
    const { data, error } = await supabase
      .from("journey_milestone_images")
      .select("*")
      .eq("milestone_id", milestoneId)
      .order("order_index", { ascending: true })
    
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

// POST a new image for a milestone
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
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
    const { url, alt_text, order_index } = await req.json()
    
    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      )
    }
    
    // Check if milestone exists
    const { data: milestone, error: milestoneError } = await supabase
      .from("journey_milestones")
      .select("id")
      .eq("id", milestoneId)
      .single()
    
    if (milestoneError || !milestone) {
      return NextResponse.json(
        { error: "Milestone not found" },
        { status: 404 }
      )
    }
    
    // Insert new image
    const { data, error } = await supabase
      .from("journey_milestone_images")
      .insert({
        milestone_id: milestoneId,
        url,
        alt_text: alt_text || null,
        order_index: order_index || 0
      })
      .select()
      .single()
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
} 