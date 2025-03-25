import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// List all tags
export async function GET() {
  try {
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