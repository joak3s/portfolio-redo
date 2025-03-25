import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: tools, error } = await supabaseAdmin
      .from('tools')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching tools:', error)
      throw error
    }

    return NextResponse.json(tools || [])
  } catch (error) {
    console.error('Error in GET /api/tools:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tools', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 