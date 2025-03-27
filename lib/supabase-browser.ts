import { createBrowserClient } from '@supabase/ssr'
import { type Database } from './database.types'

// Create a client-side Supabase client (for use in Client Components)
export const supabaseClient = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
) 