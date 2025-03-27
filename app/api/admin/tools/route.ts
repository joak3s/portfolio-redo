import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
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

// List all tools
export async function GET() {
  try {
    // Verify the request is from an authenticated admin
    const isAdmin = await verifyAdmin()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: tools, error } = await supabaseAdmin
      .from('tools')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching tools:', error)
      return NextResponse.json({ error: 'Failed to fetch tools', details: error.message }, { status: 500 })
    }

    return NextResponse.json(tools || [])
  } catch (error) {
    console.error('Error in GET /api/admin/tools:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tools', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Create a new tool
export async function POST(req: NextRequest) {
  try {
    // Verify the request is from an authenticated admin
    const isAdmin = await verifyAdmin()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Safely parse the request body
    let body;
    try {
      body = await req.json()
    } catch (parseError) {
      console.error('Error parsing request body:', parseError)
      return NextResponse.json({ 
        error: 'Invalid request body', 
        details: 'Could not parse JSON data' 
      }, { status: 400 })
    }
    
    // Validate required fields
    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      return NextResponse.json({ error: 'Tool name is required' }, { status: 400 })
    }
    
    // Generate slug if not provided
    if (!body.slug || typeof body.slug !== 'string' || body.slug.trim() === '') {
      body.slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    }
    
    // Insert the tool
    const { data: tool, error } = await supabaseAdmin
      .from('tools')
      .insert({ 
        name: body.name.trim(),
        slug: body.slug.trim()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating tool:', error)
      return NextResponse.json({ error: 'Failed to create tool', details: error.message }, { status: 500 })
    }

    return NextResponse.json(tool)
  } catch (error) {
    console.error('Error in POST /api/admin/tools:', error)
    return NextResponse.json(
      { error: 'Failed to create tool', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Delete a tool
export async function DELETE(req: NextRequest) {
  try {
    // Verify the request is from an authenticated admin
    const isAdmin = await verifyAdmin()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Tool ID is required' }, { status: 400 })
    }

    // First, check if the tool exists
    const { data: existingTool, error: checkError } = await supabaseAdmin
      .from('tools')
      .select('id')
      .eq('id', id)
      .single()
      
    if (checkError || !existingTool) {
      console.error('Tool not found:', id)
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 })
    }
    
    // Delete the tool
    const { error: deleteError } = await supabaseAdmin
      .from('tools')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting tool:', deleteError)
      return NextResponse.json({ 
        error: 'Failed to delete tool', 
        details: deleteError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Tool deleted successfully' 
    })
  } catch (error) {
    console.error('Error in DELETE /api/admin/tools:', error)
    return NextResponse.json(
      { error: 'Failed to delete tool', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 