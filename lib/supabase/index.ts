import { createClient } from '@supabase/supabase-js'

// Re-export the direct client for client-side usage
export { supabase } from './direct'

// Create a Supabase admin client with service role
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
) 