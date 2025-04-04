import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "./types/supabase"

// Remote Supabase URL and key - hardcoded to ensure client components always use remote
const REMOTE_SUPABASE_URL = "https://lgtldjzglbzlmmxphfxw.supabase.co"

// IMPORTANT: Using hardcoded key to guarantee it's available at runtime in the browser
// Environment variables in Next.js client components only work if they're inlined at build time
const REMOTE_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxndGxkanpnbGJ6bG1teHBoZnh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3MTkyNTksImV4cCI6MjA1NzI5NTI1OX0.TH_nrrp0W0MIJ7jaFZGPSe1vIYc6S7Oydl0Kw8UNe-c"

// Create a client-side Supabase client (for use in Client Components)
// Always using remote instance to avoid conflicts with local Docker
export const supabaseClient = createBrowserClient<Database>(
  REMOTE_SUPABASE_URL,
  REMOTE_SUPABASE_ANON_KEY
)

// Log which Supabase instance is being used (for debugging)
console.log(`Browser client using Supabase URL: ${REMOTE_SUPABASE_URL}`) 