import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Define types for our results
type AuthResult = {
  status: string;
  error: string | null;
  data: Record<string, any> | null;
}

// Detailed auth debugging endpoint
export async function GET(req: NextRequest) {
  const cookieStore = cookies()
  
  // Get all cookies for analysis
  const allCookies = cookieStore.getAll().map(cookie => ({
    name: cookie.name,
    value: cookie.name.includes('token') || cookie.name.includes('auth') 
      ? `${cookie.value.substring(0, 10)}...`
      : cookie.value,
    // Safely omit path and expires which don't exist on RequestCookie
  }))
  
  // Look for Supabase-specific cookies
  const supabaseCookies = allCookies.filter(cookie => 
    cookie.name.includes('supabase') || 
    cookie.name.includes('auth') || 
    cookie.name.includes('sb-')
  )

  // Test server-side authentication
  let serverAuthResult: AuthResult = { status: 'unknown', error: null, data: null }
  
  try {
    // Create a supabase client using our standardized implementation
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      serverAuthResult = {
        status: 'error',
        error: error.message,
        data: null
      }
    } else if (data?.session) {
      serverAuthResult = {
        status: 'authenticated',
        error: null,
        data: {
          user_id: data.session.user.id,
          email: data.session.user.email,
          expires_at: data.session.expires_at 
            ? new Date(data.session.expires_at * 1000).toISOString()
            : 'unknown',
        }
      }
    } else {
      serverAuthResult = {
        status: 'no_session',
        error: null,
        data: null
      }
    }
  } catch (e) {
    serverAuthResult = {
      status: 'exception',
      error: e instanceof Error ? e.message : String(e),
      data: null
    }
  }
  
  // Test direct admin access to check if user exists
  let userCheckResult: AuthResult = { status: 'unknown', error: null, data: null }
  const email = req.nextUrl.searchParams.get('email')
  
  if (email) {
    try {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers()
      
      if (error) {
        userCheckResult = {
          status: 'error',
          error: error.message,
          data: null
        }
      } else {
        const userExists = data.users.some(user => user.email === email)
        userCheckResult = {
          status: 'success',
          error: null,
          data: {
            userExists,
            userCount: data.users.length,
          }
        }
      }
    } catch (e) {
      userCheckResult = {
        status: 'exception',
        error: e instanceof Error ? e.message : String(e),
        data: null
      }
    }
  }
  
  // Report environment variables (masked)
  const envVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL 
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 20)}...` 
      : 'missing',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
      ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 10)}...` 
      : 'missing',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY 
      ? `${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 10)}...` 
      : 'missing',
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    cookies: {
      all: allCookies,
      supabase: supabaseCookies,
      count: allCookies.length,
      supabaseCount: supabaseCookies.length
    },
    auth: {
      server: serverAuthResult,
      userCheck: userCheckResult
    },
    environment: envVars
  })
} 