import { createClient } from '@supabase/supabase-js'

// Create a single instance of the Supabase client to use throughout the app
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)