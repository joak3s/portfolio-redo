import { createClient } from '@supabase/supabase-js'
import { type Database } from './database.types'

// More robust URL validation
const getSupabaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) {
    console.error('FATAL: Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
  }
  
  // Validate URL format
  try {
    new URL(url)
  } catch (e) {
    console.error('FATAL: Invalid NEXT_PUBLIC_SUPABASE_URL format:', url)
    throw new Error('Invalid Supabase URL format')
  }
  
  return url
}

// More robust service role key validation
const getServiceRoleKey = () => {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) {
    console.error('FATAL: Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')
  }
  
  if (key === 'missing-service-role-key') {
    console.error('FATAL: Using placeholder value for SUPABASE_SERVICE_ROLE_KEY')
    throw new Error('Invalid service role key - using placeholder value')
  }
  
  return key
}

// Admin client with service role for server-side operations only
export const createAdminClient = () => {
  try {
    const url = getSupabaseUrl()
    const key = getServiceRoleKey()
    
    console.log(`Creating Supabase admin client with URL: ${url.substring(0, 20)}...`)
    
    return createClient<Database>(
      url,
      key,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )
  } catch (error) {
    console.error('Failed to create Supabase admin client:', error)
    // Re-throw to make failures explicit rather than silent
    throw error
  }
}

// Export singleton admin client for server-side use
export const supabaseAdmin = createAdminClient()

// Utility to test the connection
export const testSupabaseConnection = async () => {
  try {
    // Try a simple query to check connection
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select('count(*)', { count: 'exact', head: true })
    
    if (error) {
      console.error('Supabase connection test failed with error:', error)
      return { 
        success: false, 
        message: error.message || 'Database query failed',
        error 
      }
    }
    
    return { 
      success: true, 
      message: 'Successfully connected to Supabase database',
      data
    }
  } catch (error) {
    console.error('Supabase connection test failed with exception:', error)
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown database connection error',
      error
    }
  }
} 