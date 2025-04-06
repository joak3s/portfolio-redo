import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

// Remote Supabase URL and key - hardcoded to ensure consistent use across the application
const REMOTE_SUPABASE_URL = "https://lgtldjzglbzlmmxphfxw.supabase.co"
const REMOTE_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxndGxkanpnbGJ6bG1teHBoZnh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3MTkyNTksImV4cCI6MjA1NzI5NTI1OX0.TH_nrrp0W0MIJ7jaFZGPSe1vIYc6S7Oydl0Kw8UNe-c"

export async function middleware(req: NextRequest) {
  // Debug log for troubleshooting
  console.log(`Middleware processing: ${req.nextUrl.pathname}`);
  
  // Add API monitoring headers for all API routes
  if (req.nextUrl.pathname.startsWith('/api/')) {
    // Add custom headers for better timeout handling and diagnostics
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('X-Request-Start-Time', Date.now().toString());
    
    const res = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    
    // For non-auth API routes, we're done
    if (!req.nextUrl.pathname.startsWith('/api/admin')) {
      return res;
    }
  }
  
  // Only proceed with auth checks for admin routes
  const res = NextResponse.next();
  
  // Create a Supabase client using the SSR package with hardcoded remote URL
  const supabase = createServerClient(
    REMOTE_SUPABASE_URL,
    REMOTE_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          const cookie = req.cookies.get(name)?.value;
          if (cookie) {
            console.log(`Middleware found cookie: ${name.substring(0, 5)}... (value hidden)`);
          }
          return cookie;
        },
        set(name: string, value: string, options: CookieOptions) {
          console.log(`Middleware setting cookie: ${name.substring(0, 5)}... (value hidden)`);
          res.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          console.log(`Middleware removing cookie: ${name.substring(0, 5)}...`);
          res.cookies.set({
            name,
            value: '',
            ...options,
            maxAge: 0,
          })
        },
      },
    }
  )
  
  try {
    // Refresh session if it exists
    const { data } = await supabase.auth.getSession()
    
    // Skip auth check for login page to avoid redirect loop
    if (req.nextUrl.pathname === '/auth/login') {
      return res
    }
    
    // For admin routes, redirect to login if no session
    if (req.nextUrl.pathname.startsWith('/admin') && !data.session) {
      console.log('No session found for admin route, redirecting to login');
      
      // Store the original URL to redirect back after login
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/auth/login'
      
      // Add the return URL as a query parameter
      redirectUrl.searchParams.set('returnUrl', req.nextUrl.pathname)
      
      return NextResponse.redirect(redirectUrl)
    }
    
    // Session exists or non-protected route, continue
    return res
  } catch (error) {
    console.error('Middleware auth error:', error)
    return res
  }
}

export const config = {
  matcher: [
    // Apply this middleware to admin routes and API calls
    '/admin/:path*',
    '/api/:path*',
    '/auth/login',
  ],
} 