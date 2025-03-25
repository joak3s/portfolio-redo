import { createClient } from '@supabase/supabase-js'

// Ensure environment variables are available and throw helpful errors if not
const getSupabaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) {
    if (process.env.NODE_ENV === 'production') {
      console.error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
      // In production, return a dummy value to allow the build to complete
      return 'https://placeholder-url.supabase.co'
    }
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL environment variable. ' +
      'Please check your .env.local file or environment variables configuration.'
    )
  }
  return url
}

const getSupabaseAnonKey = () => {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!key) {
    if (process.env.NODE_ENV === 'production') {
      console.error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
      // In production, return a dummy value to allow the build to complete
      return 'placeholder-key'
    }
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. ' +
      'Please check your .env.local file or environment variables configuration.'
    )
  }
  return key
}

// Create Supabase client
export const supabaseClient = createClient(
  getSupabaseUrl(),
  getSupabaseAnonKey(),
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  }
) 