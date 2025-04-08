'use server'

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
  // Verify this code is running on the server
  if (typeof window !== 'undefined') {
    throw new Error('SECURITY ERROR: Attempted to access service role key in browser environment')
  }

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

/**
 * Creates an admin Supabase client with service role permissions
 * SECURITY WARNING: This client should ONLY be used in server-side code
 * Never expose the service role key to the client
 */
const createAdminClient = () => {
  try {
    // Double-check we're on the server
    if (typeof window !== 'undefined') {
      throw new Error('SECURITY ERROR: Admin client can only be used server-side')
    }

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

// Singleton instance (private to this module)
let _supabaseAdminInstance: ReturnType<typeof createAdminClient> | null = null;

/**
 * Gets a Supabase admin client instance for server-side use only
 * This is a server action that returns a client instance
 */
export async function getAdminClient() {
  if (!_supabaseAdminInstance) {
    _supabaseAdminInstance = createAdminClient();
  }
  return _supabaseAdminInstance;
}

// For backwards compatibility with existing imports
// IMPORTANT: This client is instantiated immediately and should be used carefully
export const supabaseAdmin = createAdminClient();

/**
 * Test the Supabase connection with the admin client
 * Server action that returns the connection status
 */
export async function testConnection() {
  const supabaseAdmin = await getAdminClient();
  
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

/**
 * Execute a query with retry logic (server-side only)
 */
export async function executeWithRetry<T>(
  queryFn: (client: ReturnType<typeof createAdminClient>) => Promise<{ data: T | null; error: any }>,
  options: { maxRetries?: number, retryDelay?: number } = {}
): Promise<{ data: T | null; error: any }> {
  const { maxRetries = 3, retryDelay = 1000 } = options;
  const supabaseAdmin = await getAdminClient();
  
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await queryFn(supabaseAdmin);
      
      if (!result.error) {
        return result;
      }
      
      lastError = result.error;
      console.warn(`Query attempt ${attempt}/${maxRetries} failed:`, result.error);
      
      // If not the last attempt, wait before retrying
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    } catch (error) {
      lastError = error;
      console.warn(`Query attempt ${attempt}/${maxRetries} failed with exception:`, error);
      
      // If not the last attempt, wait before retrying
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    }
  }
  
  return { data: null, error: lastError };
} 