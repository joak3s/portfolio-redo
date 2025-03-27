import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Create a Supabase client using the SSR package
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          res.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          res.cookies.set({
            name,
            value: '',
            ...options,
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
    '/api/admin/:path*',
    '/auth/login',
  ],
} 