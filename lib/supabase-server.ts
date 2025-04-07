'use server'

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { type Database } from './database.types'

// Get Supabase URL with fallback
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lgtldjzglbzlmmxphfxw.supabase.co"
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxndGxkanpnbGJ6bG1teHBoZnh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3MTkyNTksImV4cCI6MjA1NzI5NTI1OX0.TH_nrrp0W0MIJ7jaFZGPSe1vIYc6S7Oydl0Kw8UNe-c"

/**
 * Creates a server-side Supabase client with cookie handling
 * For use in Server Components and Route Handlers
 * Uses the anonymous key by default, but with server-side auth
 */
export async function createServerSupabaseClient() {
  const cookieStore = cookies()
  
  console.log(`Creating server Supabase client with URL: ${SUPABASE_URL.substring(0, 20)}...`)
  
  return createServerClient<Database>(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set(name, value, options)
          } catch (error) {
            // Handle Next.js ReadonlyHeaders error in middleware or Server Actions
            console.error(`Cookie set error for ${name}:`, error)
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set(name, '', { 
              ...options, 
              maxAge: 0,
              expires: new Date(0)
            })
          } catch (error) {
            console.error(`Cookie remove error for ${name}:`, error)
          }
        },
      },
    }
  )
} 