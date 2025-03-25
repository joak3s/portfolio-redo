import { createClient } from '@supabase/supabase-js'
import { type CookieOptions } from '@supabase/ssr'
import { type Database } from './database.types'

const getSupabaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
  return url
}

const getSupabaseAnonKey = () => {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY')
  return key
}

const getServiceRoleKey = () => {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')
  return key
}

// Client-side Supabase client (for use in Client Components)
export const createBrowserClient = () => {
  return createClient<Database>(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    }
  )
}

// Admin client with service role for backend operations
export const createAdminClient = () => {
  return createClient<Database>(
    getSupabaseUrl(),
    getServiceRoleKey(),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

// Export singleton instances for common use cases
export const supabaseClient = createBrowserClient()
export const supabaseAdmin = createAdminClient()

// Create a separate file for server-side client
// This will be used in Server Components and API routes 