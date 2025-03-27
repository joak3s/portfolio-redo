import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, testSupabaseConnection } from '@/lib/supabase-admin'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// No authentication required for this diagnostic endpoint
export async function GET(req: NextRequest) {
  try {
    // Log to verify if service role key is available
    console.log('Service role key available:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    // Get basic server health info
    const healthInfo = {
      server: 'OK',
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV,
      nextPublicSupabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL 
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 12)}...` 
        : 'Missing',
      nextPublicSupabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
        ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 5)}...` 
        : 'Missing',
      supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY 
        ? `${process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 5)}...` 
        : 'Missing',
    }

    // Test Supabase admin connection
    const adminConnectionResult = await testSupabaseConnection()
    
    // Test auth cookie parsing with our standardized SSR client
    let authStatus = 'Unknown'
    let authData = null
    let authError = null

    try {
      // Create a supabase client using our standardized implementation
      const supabase = createServerSupabaseClient()
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        authStatus = 'Error'
        authError = error
      } else if (data?.session) {
        authStatus = 'Authenticated'
        authData = {
          user_id: data.session.user.id,
          email: data.session.user.email,
          expires_at: data.session.expires_at 
            ? new Date(data.session.expires_at * 1000).toISOString()
            : 'unknown',
        }
      } else {
        authStatus = 'No Session'
      }
    } catch (e) {
      authStatus = 'Exception'
      authError = e instanceof Error ? e.message : String(e)
    }

    return NextResponse.json({
      health: healthInfo,
      supabase: {
        admin: adminConnectionResult,
        auth: {
          status: authStatus,
          data: authData,
          error: authError,
        }
      }
    })
  } catch (error) {
    console.error('Debug route error:', error)
    return NextResponse.json(
      {
        error: 'Debug route failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : null
      },
      { status: 500 }
    )
  }
} 