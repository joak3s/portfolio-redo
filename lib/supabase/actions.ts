'use server'

import { createClient } from './server'

export async function getProjects() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })
  
  return data
}

export async function getProject(id: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()
  
  return data
} 