import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getAuthDebugInfo } from '@/lib/auth-utils'
import { SUPABASE_CONFIG } from '@/lib/supabase-config'

// This endpoint provides debug information about auth cookies
export async function GET() {
  // Get all cookies for debugging
  const cookieStore = cookies()
  const allCookies = cookieStore.getAll().map(cookie => ({
    name: cookie.name,
    // Redact values for security
    value: cookie.name.includes('token') || cookie.name.includes('auth') 
      ? `${cookie.value.substring(0, 5)}...` 
      : `${cookie.value.substring(0, 3)}...`,
    // Next.js RequestCookie only has name and value properties
    // Other properties are not available in the server runtime
  }))
  
  // Get auth-specific debug info
  const authInfo = getAuthDebugInfo()
  
  return NextResponse.json({
    cookies: {
      all: allCookies,
      auth: authInfo.cookieInfo,
      count: allCookies.length,
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      supabaseUrl: SUPABASE_CONFIG.URL,
      anon_key_starts_with: SUPABASE_CONFIG.ANON_KEY.substring(0, 10) + '...',
    },
    expected_cookie_names: {
      session: SUPABASE_CONFIG.COOKIE_NAMES.SESSION,
    }
  })
}

// This endpoint allows clearing all auth cookies for testing
export async function POST() {
  const cookieStore = cookies()
  const cookieNames = [
    SUPABASE_CONFIG.COOKIE_NAMES.SESSION,
    'sb-refresh-token',
    'sb-access-token',
    'sb-provider-token',
  ]
  
  // Clear each cookie
  for (const name of cookieNames) {
    cookieStore.set(name, '', {
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    })
  }
  
  return NextResponse.json({
    success: true,
    message: 'Auth cookies cleared',
    clearedCookies: cookieNames,
  })
} 