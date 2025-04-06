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

// Create a custom fetch function with better error handling and timeout
const createCustomFetch = () => {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    // Default timeout of 15 seconds
    const timeout = 15000;
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    // Merge the abort signal with any existing signal
    const fetchOptions: RequestInit = {
      ...init,
      signal: controller.signal
    };
    
    try {
      const response = await fetch(input, fetchOptions);
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      
      // Improve error message based on the nature of the error
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error(`Request timed out after ${timeout}ms`);
          throw new Error(`Request timeout (${timeout}ms) to Supabase`);
        }
        
        if (error.message.includes('fetch failed')) {
          console.error(`Network error when connecting to Supabase`);
          throw new Error('Network connectivity issue with Supabase. Please check your internet connection.');
        }
      }
      
      // Re-throw the original error
      throw error;
    }
  };
};

// Admin client with service role for server-side operations only
export const createAdminClient = () => {
  try {
    const url = getSupabaseUrl()
    const key = getServiceRoleKey()
    
    console.log(`Creating Supabase admin client with URL: ${url.substring(0, 20)}...`)
    
    // Custom fetch implementation for better error handling
    const customFetch = createCustomFetch();
    
    return createClient<Database>(
      url,
      key,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        global: {
          fetch: customFetch
        }
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

// Utility function to handle retries for Supabase queries
export const withRetry = async <T>(
  queryFn: () => Promise<{ data: T | null; error: any }> | { then(onfulfilled: (value: { data: T | null; error: any }) => any): any },
  { maxRetries = 3, retryDelay = 1000 } = {}
): Promise<{ data: T | null; error: any }> => {
  let lastError = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await queryFn()
      
      if (!result.error) {
        return result
      }
      
      lastError = result.error
      console.warn(`Query attempt ${attempt}/${maxRetries} failed:`, result.error)
      
      // If not the last attempt, wait before retrying
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt))
      }
    } catch (error) {
      lastError = error
      console.warn(`Query attempt ${attempt}/${maxRetries} failed with exception:`, error)
      
      // If not the last attempt, wait before retrying
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt))
      }
    }
  }
  
  return { data: null, error: lastError }
} 