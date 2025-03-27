import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Session error:', error)
      return NextResponse.json({ 
        error: 'Failed to get session',
        details: error.message 
      }, { status: 401 })
    }
    
    // If we have a session, return the session data
    if (data?.session) {
      return NextResponse.json({
        session: {
          user: {
            id: data.session.user.id,
            email: data.session.user.email,
            created_at: data.session.user.created_at
          },
          expires_at: data.session.expires_at
        }
      })
    }
    
    // No session
    return NextResponse.json({ session: null })
  } catch (error) {
    console.error('Error getting session:', error)
    return NextResponse.json(
      { error: 'Failed to get session', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 