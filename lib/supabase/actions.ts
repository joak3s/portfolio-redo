'use server'

import { createServerSupabaseClient } from '../supabase'

/**
 * Get all projects
 * Uses the server client with user context from cookies
 */
export async function getProjects() {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching projects:', error)
    throw new Error('Failed to fetch projects')
  }
  
  return data
}

/**
 * Get a single project by ID
 * Uses the server client with user context from cookies
 */
export async function getProject(id: string) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error(`Error fetching project ${id}:`, error)
    throw new Error('Failed to fetch project')
  }
  
  return data
} 