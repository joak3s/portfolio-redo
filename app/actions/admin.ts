'use server'

import { revalidatePath } from 'next/cache'
import { getAdminClient } from '@/lib/supabase-admin'
import type { Database } from '@/lib/database.types'
import type { 
  CreateJourneyInput, 
  UpdateJourneyInput,
  AddJourneyImageInput 
} from '@/lib/types/journey'

// Type definitions
type JourneyEntry = Database['public']['Tables']['journey']['Row'] & {
  journey_images?: Database['public']['Tables']['journey_images']['Row'][];
}

/**
 * PROJECTS
 */

// Get all projects with images, tools, and tags
export async function getProjects() {
  try {
    const supabase = await getAdminClient()
    
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        project_images (*),
        project_tools (*),
        project_tags (*)
      `)
      .order('created_at', { ascending: false })
      
    if (error) throw error
    
    return data || []
  } catch (error) {
    console.error('Error fetching projects:', error)
    throw new Error('Failed to fetch projects')
  }
}

// Get a specific project by slug
export async function getProjectBySlug(slug: string) {
  try {
    const supabase = await getAdminClient()
    
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        project_images (*),
        project_tools (*),
        project_tags (*)
      `)
      .eq('slug', slug)
      .single()
      
    if (error) throw error
    
    return data || null
  } catch (error) {
    console.error(`Error fetching project with slug ${slug}:`, error)
    throw new Error('Failed to fetch project')
  }
}

// Update a project
export async function updateProject(id: string, projectData: any) {
  try {
    const supabase = await getAdminClient()
    
    const { error } = await supabase
      .from('projects')
      .update(projectData)
      .eq('id', id)
      
    if (error) throw error
    
    revalidatePath('/admin')
    revalidatePath('/admin/projects')
    revalidatePath('/projects')
    revalidatePath(`/projects/${projectData.slug}`)
    
    return { success: true }
  } catch (error) {
    console.error('Error updating project:', error)
    throw new Error('Failed to update project')
  }
}

// Create a new project
export async function createProject(projectData: any) {
  try {
    const supabase = await getAdminClient()
    
    const { data, error } = await supabase
      .from('projects')
      .insert([projectData])
      .select('*')
      
    if (error) throw error
    
    revalidatePath('/admin')
    revalidatePath('/admin/projects')
    revalidatePath('/projects')
    
    return data[0] || null
  } catch (error) {
    console.error('Error creating project:', error)
    throw new Error('Failed to create project')
  }
}

// Delete a project
export async function deleteProject(id: string) {
  try {
    const supabase = await getAdminClient()
    
    // First delete related records
    await supabase.from('project_images').delete().eq('project_id', id)
    await supabase.from('project_tools').delete().eq('project_id', id)
    await supabase.from('project_tags').delete().eq('project_id', id)
    
    // Then delete the project
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      
    if (error) throw error
    
    revalidatePath('/admin')
    revalidatePath('/admin/projects')
    revalidatePath('/projects')
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting project:', error)
    throw new Error('Failed to delete project')
  }
}

/**
 * JOURNEY ENTRIES
 */

// Get all journey entries with their images
export async function getJourneyEntries() {
  try {
    const supabase = await getAdminClient()
    
    // Fetch journey entries
    const { data: journeyData, error: journeyError } = await supabase
      .from('journey')
      .select('*')
      .order('display_order', { ascending: true })
    
    if (journeyError) throw journeyError
    
    // If no journeys, return empty array
    if (!journeyData || journeyData.length === 0) {
      return []
    }
    
    // Get IDs to fetch images
    const journeyIds = journeyData.map(entry => entry.id)
    
    // Fetch images for all journey entries
    const { data: imagesData, error: imagesError } = await supabase
      .from('journey_images')
      .select('*')
      .in('journey_id', journeyIds)
      .order('order_index', { ascending: true })
    
    if (imagesError) throw imagesError
    
    // Group images by journey_id
    const imagesByJourneyId = (imagesData || []).reduce((acc, image) => {
      if (!acc[image.journey_id]) {
        acc[image.journey_id] = []
      }
      acc[image.journey_id].push(image)
      return acc
    }, {} as Record<string, any[]>)
    
    // Combine journey entries with their images
    const entriesWithImages = journeyData.map(entry => ({
      ...entry,
      journey_images: imagesByJourneyId[entry.id] || []
    }))
    
    return entriesWithImages as JourneyEntry[]
  } catch (error) {
    console.error('Error fetching journey entries:', error)
    throw new Error('Failed to fetch journey entries')
  }
}

// Get a single journey entry by ID
export async function getJourneyEntry(id: string) {
  try {
    const supabase = await getAdminClient()
    
    // Fetch journey entry
    const { data, error } = await supabase
      .from('journey')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    
    // Fetch images for this journey entry
    const { data: imagesData, error: imagesError } = await supabase
      .from('journey_images')
      .select('*')
      .eq('journey_id', id)
      .order('order_index', { ascending: true })
    
    if (imagesError) throw imagesError
    
    // Return journey with images
    return {
      ...data,
      journey_images: imagesData || []
    } as JourneyEntry
  } catch (error) {
    console.error(`Error fetching journey entry with ID ${id}:`, error)
    throw new Error('Failed to fetch journey entry')
  }
}

// Create a new journey entry
export async function createJourneyEntry(journeyData: CreateJourneyInput) {
  try {
    const supabase = await getAdminClient()
    
    const { data, error } = await supabase
      .from('journey')
      .insert([journeyData])
      .select('*')
      
    if (error) throw error
    
    revalidatePath('/admin')
    revalidatePath('/admin/journey')
    
    return data[0] || null
  } catch (error) {
    console.error('Error creating journey entry:', error)
    throw new Error('Failed to create journey entry')
  }
}

// Update a journey entry
export async function updateJourneyEntry(journeyData: UpdateJourneyInput) {
  try {
    const supabase = await getAdminClient()
    const { id, ...updateData } = journeyData
    
    const { error } = await supabase
      .from('journey')
      .update(updateData)
      .eq('id', id)
      
    if (error) throw error
    
    revalidatePath('/admin')
    revalidatePath('/admin/journey')
    
    return { success: true }
  } catch (error) {
    console.error('Error updating journey entry:', error)
    throw new Error('Failed to update journey entry')
  }
}

// Delete a journey entry
export async function deleteJourneyEntry(id: string) {
  try {
    const supabase = await getAdminClient()
    
    // First delete related images
    await supabase
      .from('journey_images')
      .delete()
      .eq('journey_id', id)
    
    // Then delete the journey entry
    const { error } = await supabase
      .from('journey')
      .delete()
      .eq('id', id)
      
    if (error) throw error
    
    revalidatePath('/admin')
    revalidatePath('/admin/journey')
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting journey entry:', error)
    throw new Error('Failed to delete journey entry')
  }
}

/**
 * JOURNEY IMAGES
 */

// Add an image to a journey entry
export async function addJourneyImage(imageData: AddJourneyImageInput) {
  try {
    const supabase = await getAdminClient()
    
    // If no order_index provided, get the highest existing one and add 1
    if (!imageData.order_index) {
      const { data: existingImages, error: fetchError } = await supabase
        .from('journey_images')
        .select('order_index')
        .eq('journey_id', imageData.journey_id)
        .order('order_index', { ascending: false })
        .limit(1)
      
      if (fetchError) throw fetchError
      
      const nextOrderIndex = existingImages && existingImages.length > 0
        ? (existingImages[0].order_index || 0) + 1
        : 1
      
      imageData.order_index = nextOrderIndex
    }
    
    const { data, error } = await supabase
      .from('journey_images')
      .insert([imageData])
      .select('*')
      
    if (error) throw error
    
    revalidatePath('/admin')
    revalidatePath('/admin/journey')
    
    return data[0] || null
  } catch (error) {
    console.error('Error adding journey image:', error)
    throw new Error('Failed to add journey image')
  }
}

// Delete a journey image
export async function deleteJourneyImage(imageId: string, journeyId: string) {
  try {
    const supabase = await getAdminClient()
    
    // Delete the image
    const { error } = await supabase
      .from('journey_images')
      .delete()
      .eq('id', imageId)
      
    if (error) throw error
    
    // Reorder remaining images
    await reorderJourneyImages(journeyId)
    
    revalidatePath('/admin')
    revalidatePath('/admin/journey')
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting journey image:', error)
    throw new Error('Failed to delete journey image')
  }
}

// Helper function to reorder images after deletion or manual reordering
async function reorderJourneyImages(journeyId: string) {
  try {
    const supabase = await getAdminClient()
    
    // Get all images for this journey, ordered by current order_index
    const { data: images, error } = await supabase
      .from('journey_images')
      .select('*')
      .eq('journey_id', journeyId)
      .order('order_index', { ascending: true })
      
    if (error) throw error
    
    // Update each image with a new sequential order_index
    for (let i = 0; i < (images || []).length; i++) {
      const { error: updateError } = await supabase
        .from('journey_images')
        .update({ order_index: i + 1 })
        .eq('id', images[i].id)
        
      if (updateError) throw updateError
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error reordering journey images:', error)
    throw new Error('Failed to reorder journey images')
  }
}

// Update the order of journey images based on a provided array of image IDs
export async function updateJourneyImageOrder(journeyId: string, imageIds: string[]) {
  try {
    const supabase = await getAdminClient()
    
    // Update each image with its new order_index
    for (let i = 0; i < imageIds.length; i++) {
      const { error } = await supabase
        .from('journey_images')
        .update({ order_index: i + 1 })
        .eq('id', imageIds[i])
        .eq('journey_id', journeyId)
        
      if (error) throw error
    }
    
    revalidatePath('/admin')
    revalidatePath('/admin/journey')
    
    return { success: true }
  } catch (error) {
    console.error('Error updating journey image order:', error)
    throw new Error('Failed to update journey image order')
  }
} 