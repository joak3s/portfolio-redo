import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// List all tools
export async function GET() {
  try {
    const { data: tools, error } = await supabaseAdmin
      .from('tools')
      .select('*')
      .order('name')

    if (error) {
      console.error('Supabase error:', error)
      throw error
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
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const { data: tool, error } = await supabaseAdmin
      .from('tools')
      .insert({ name: body.name })
      .select()
      .single()

    if (error) {
      console.error('Error creating tool:', error)
      throw error
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
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Tool ID is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('tools')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting tool:', error)
    return NextResponse.json(
      { error: 'Failed to delete tool', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 