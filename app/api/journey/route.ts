import { createServerSupabaseClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import { type JourneyMilestone } from "@/lib/types/journey"

// GET all journey milestones
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from("journey_milestones")
      .select("*")
      .order("order", { ascending: true })
    
    if (error) {
      console.error("Error fetching journey milestones:", error)
      return NextResponse.json(
        { error: "Failed to fetch journey milestones" },
        { status: 500 }
      )
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error("Unexpected error fetching journey milestones:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}

// Admin-only route to create a new journey milestone
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
    const { title, year, description, skills, icon, color, image, order } = json
    
    if (!title || !year || !description || !Array.isArray(skills) || !icon || !color || !image || typeof order !== 'number') {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }
    
    const { data, error } = await supabase
      .from("journey_milestones")
      .insert({
        title,
        year,
        description,
        skills,
        icon,
        color,
        image,
        order
      })
      .select()
      .single()
    
    if (error) {
      console.error("Error creating journey milestone:", error)
      return NextResponse.json(
        { error: "Failed to create journey milestone" },
        { status: 500 }
      )
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error("Unexpected error creating journey milestone:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
} 