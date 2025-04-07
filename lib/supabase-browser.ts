'use client'

import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "./database.types"

// Remote Supabase URL and key - hardcoded to ensure client components always use remote
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lgtldjzglbzlmmxphfxw.supabase.co'

// IMPORTANT: Using anon key - never use service role key in browser code
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxndGxkanpnbGJ6bG1teHBoZnh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3MTkyNTksImV4cCI6MjA1NzI5NTI1OX0.TH_nrrp0W0MIJ7jaFZGPSe1vIYc6S7Oydl0Kw8UNe-c'

/**
 * Browser-safe Supabase client for client components
 * Uses the anonymous key only and handles auth state in the browser
 */
export const supabaseClient = createBrowserClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
)

// Log which Supabase instance is being used (for debugging)
console.log(`Browser client using Supabase URL: ${SUPABASE_URL}`) 