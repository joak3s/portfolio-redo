import { createServerSupabaseClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

// GET a specific journey milestone
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    if (!id) {
      return NextResponse.json(
        { error: "Milestone ID is required" },
        { status: 400 }
      )
    }
    
    const supabase = await createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from("journey_milestones")
      .select("*")
      .eq("id", id)
      .single()
    
    if (error) {
      console.error(`Error fetching journey milestone ${id}:`, error)
      return NextResponse.json(
        { error: "Failed to fetch journey milestone" },
        { status: 500 }
      )
    }
    
    if (!data) {
      return NextResponse.json(
        { error: "Journey milestone not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error("Unexpected error fetching journey milestone:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}

// Update a journey milestone (admin only)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    if (!id) {
      return NextResponse.json(
        { error: "Milestone ID is required" },
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
    
    const { data, error } = await supabase
      .from("journey_milestones")
      .update(json)
      .eq("id", id)
      .select()
      .single()
    
    if (error) {
      console.error(`Error updating journey milestone ${id}:`, error)
      return NextResponse.json(
        { error: "Failed to update journey milestone" },
        { status: 500 }
      )
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error("Unexpected error updating journey milestone:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}

// Delete a journey milestone (admin only)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    if (!id) {
      return NextResponse.json(
        { error: "Milestone ID is required" },
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
    
    const { error } = await supabase
      .from("journey_milestones")
      .delete()
      .eq("id", id)
    
    if (error) {
      console.error(`Error deleting journey milestone ${id}:`, error)
      return NextResponse.json(
        { error: "Failed to delete journey milestone" },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Unexpected error deleting journey milestone:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
} 