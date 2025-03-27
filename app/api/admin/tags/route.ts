import { NextResponse } from 'next/server'
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

// List all tags
export async function GET() {
  try {
    // Verify the request is from an authenticated admin
    const isAdmin = await verifyAdmin()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { data: tags, error } = await supabaseAdmin
      .from('tags')
      .select('*')
      .order('name')

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    return NextResponse.json(tags || [])
  } catch (error) {
    console.error('Error in GET /api/admin/tags:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tags', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Create a new tag
export async function POST(request: Request) {
  try {
    // Verify the request is from an authenticated admin
    const isAdmin = await verifyAdmin()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    
    const { data: tag, error } = await supabaseAdmin
      .from('tags')
      .insert({ name: body.name })
      .select()
      .single()

    if (error) {
      console.error('Error creating tag:', error)
      throw error
    }

    return NextResponse.json(tag)
  } catch (error) {
    console.error('Error in POST /api/admin/tags:', error)
    return NextResponse.json(
      { error: 'Failed to create tag', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Delete a tag
export async function DELETE(request: Request) {
  try {
    // Verify the request is from an authenticated admin
    const isAdmin = await verifyAdmin()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Tag ID is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('tags')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting tag:', error)
    return NextResponse.json(
      { error: 'Failed to delete tag', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 