import { createClient } from '@supabase/supabase-js'

const getSupabaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) {
    if (process.env.NODE_ENV === 'production') {
      console.error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
      return 'https://placeholder-url.supabase.co'
    }
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
  }
  return url
}

const getServiceRoleKey = () => {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) {
    if (process.env.NODE_ENV === 'production') {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
      return 'placeholder-key'
    }
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
  }
  return key
}

// Create Supabase admin client with service role key
export const supabaseAdmin = createClient(
  getSupabaseUrl(),
  getServiceRoleKey(),
  {
    auth: {
      persistSession: false, // Admin client shouldn't persist sessions
      autoRefreshToken: true,
    }
  }
) 