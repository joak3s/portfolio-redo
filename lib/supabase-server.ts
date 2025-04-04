'use server'

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { type Database } from './types/supabase'

// Remote Supabase URL and key - hardcoded to ensure server components always use remote
const REMOTE_SUPABASE_URL = "https://lgtldjzglbzlmmxphfxw.supabase.co"
const REMOTE_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxndGxkanpnbGJ6bG1teHBoZnh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3MTkyNTksImV4cCI6MjA1NzI5NTI1OX0.TH_nrrp0W0MIJ7jaFZGPSe1vIYc6S7Oydl0Kw8UNe-c"

// Create a server-side Supabase client (for use in Server Components and Route Handlers)
export async function createServerSupabaseClient() {
  const cookieStore = cookies()
  
  console.log(`Creating server Supabase client with remote URL: ${REMOTE_SUPABASE_URL.substring(0, 20)}...`)
  
  return createServerClient<Database>(
    REMOTE_SUPABASE_URL,
    REMOTE_SUPABASE_ANON_KEY,
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