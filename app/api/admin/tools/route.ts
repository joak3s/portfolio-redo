import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// Helper function to verify admin authentication
async function verifyAdmin() {
  try {
    // Create a supabase client using our standardized SSR implementation
    const supabase = await createServerSupabaseClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Authentication error:', error)
      return false
    }
    
    if (!session) {
      console.error('No active session')
      return false
    }
    
    // You could add additional role checks here if needed
    return true
  } catch (error) {
    console.error('Authentication verification error:', error)
    return false
  }
}

// GET /api/admin/tools - Get all tools
export async function GET() {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabaseAdmin = await getAdminClient()
    const { data: tools, error } = await supabaseAdmin
      .from('tools')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching tools:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(tools)
  } catch (error) {
    console.error('Error in GET /api/admin/tools:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST /api/admin/tools - Create a new tool
export async function POST(request: NextRequest) {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const toolData = await request.json()
    
    if (!toolData.name) {
      return NextResponse.json(
        { error: 'Tool name is required' },
        { status: 400 }
      )
    }
    
    const supabaseAdmin = await getAdminClient()
    const { data: tool, error } = await supabaseAdmin
      .from('tools')
      .insert([toolData])
      .select()
      .single()
    
    if (error) {
      console.error('Error creating tool:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json(tool)
  } catch (error) {
    console.error('Error in POST /api/admin/tools:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/tools?id={id} - Delete a tool
export async function DELETE(request: NextRequest) {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Tool ID is required' },
        { status: 400 }
      )
    }
    
    // First, check if the tool exists
    const supabaseAdmin = await getAdminClient()
    const { data: existingTool, error: checkError } = await supabaseAdmin
      .from('tools')
      .select('id')
      .eq('id', id)
      .single()
    
    if (checkError || !existingTool) {
      return NextResponse.json(
        { error: 'Tool not found' },
        { status: 404 }
      )
    }
    
    // Delete the tool
    const { error: deleteError } = await supabaseAdmin
      .from('tools')
      .delete()
      .eq('id', id)
    
    if (deleteError) {
      console.error('Error deleting tool:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }
    
    return NextResponse.json({ message: 'Tool deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/admin/tools:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/tools?id={id} - Update a tool
export async function PUT(request: NextRequest) {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Tool ID is required' },
        { status: 400 }
      )
    }
    
    const toolData = await request.json()
    
    // Check if the tool exists
    const supabaseAdmin = await getAdminClient()
    const { data: existingTool, error: checkError } = await supabaseAdmin
      .from('tools')
      .select('id')
      .eq('id', id)
      .single()
    
    if (checkError || !existingTool) {
      return NextResponse.json(
        { error: 'Tool not found' },
        { status: 404 }
      )
    }
    
    // Update the tool
    const { error: deleteError } = await supabaseAdmin
      .from('tools')
      .update(toolData)
      .eq('id', id)
    
    if (deleteError) {
      console.error('Error updating tool:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }
    
    return NextResponse.json({ message: 'Tool updated successfully' })
  } catch (error) {
    console.error('Error in PUT /api/admin/tools:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 