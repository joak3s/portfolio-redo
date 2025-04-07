/**
 * Centralized Supabase client exports
 * 
 * This file exports all Supabase clients to be used throughout the application.
 * Each client is designed for a specific environment and use case:
 * 
 * - supabaseClient: For browser/client components
 * - createServerSupabaseClient: For server components and actions
 * - getAdminClient: For server-side admin operations (NEVER use on client)
 */

// Re-export the browser client for client components
export { supabaseClient } from './supabase-browser'

// Re-export the server client for server components
export { createServerSupabaseClient } from './supabase-server'

// Re-export the admin client for server-side admin operations only
// This should only be imported in server-side code (API routes, Server Actions)
export { getAdminClient, executeWithRetry } from './supabase-admin' 