import { getAdminClient } from '@/lib/supabase-admin'
import type { ProjectImage, ProjectUpdate } from '@/lib/types'

/**
 * Update project images in the database
 */
export async function updateProjectImages(projectId: string, images: any[]) {
  try {
    if (!projectId) {
      throw new Error("Project ID is required")
    }

    if (!images || !Array.isArray(images)) {
      console.log("No images to update or invalid images data")
      return
    }

    const supabaseAdmin = await getAdminClient()

    // Delete existing images for this project
    const { error: deleteError } = await supabaseAdmin
      .from('project_images')
      .delete()
      .eq('project_id', projectId)

    if (deleteError) {
      console.error("Error deleting existing project images:", deleteError)
      throw deleteError
    }

    // If there are no new images, we're done
    if (images.length === 0) {
      console.log("No new images to add")
      return
    }

    // Insert the new images
    const formattedImages = images.map((img, index) => ({
      project_id: projectId,
      url: img.url,
      alt_text: img.alt_text || '',
      order_index: img.order_index || index
    }))

    const { error: insertError } = await supabaseAdmin
      .from('project_images')
      .insert(formattedImages)

    if (insertError) {
      console.error("Error inserting project images:", insertError)
      throw insertError
    }

    console.log(`Successfully updated ${images.length} images for project ${projectId}`)
  } catch (error) {
    console.error("Error in updateProjectImages:", error)
    throw error
  }
}

/**
 * Update project tools in the database
 */
export async function updateProjectTools(projectId: string, tools: string[]) {
  try {
    if (!projectId) {
      throw new Error("Project ID is required")
    }

    if (!tools || !Array.isArray(tools)) {
      console.log("No tools to update or invalid tools data")
      return
    }

    const supabaseAdmin = await getAdminClient()

    // Delete existing tools for this project
    const { error: deleteError } = await supabaseAdmin
      .from('project_tools')
      .delete()
      .eq('project_id', projectId)

    if (deleteError) {
      console.error("Error deleting existing project tools:", deleteError)
      throw deleteError
    }

    // If there are no new tools, we're done
    if (tools.length === 0) {
      console.log("No new tools to add")
      return
    }

    // Insert the new tools
    const formattedTools = tools.map(toolId => ({
      project_id: projectId,
      tool_id: toolId
    }))

    const { error: insertError } = await supabaseAdmin
      .from('project_tools')
      .insert(formattedTools)

    if (insertError) {
      console.error("Error inserting project tools:", insertError)
      throw insertError
    }

    console.log(`Successfully updated ${tools.length} tools for project ${projectId}`)
  } catch (error) {
    console.error("Error in updateProjectTools:", error)
    throw error
  }
}

/**
 * Update project tags in the database
 */
export async function updateProjectTags(projectId: string, tags: string[]) {
  try {
    if (!projectId) {
      throw new Error("Project ID is required")
    }

    if (!tags || !Array.isArray(tags)) {
      console.log("No tags to update or invalid tags data")
      return
    }

    const supabaseAdmin = await getAdminClient()

    // Delete existing tags for this project
    const { error: deleteError } = await supabaseAdmin
      .from('project_tags')
      .delete()
      .eq('project_id', projectId)

    if (deleteError) {
      console.error("Error deleting existing project tags:", deleteError)
      throw deleteError
    }

    // If there are no new tags, we're done
    if (tags.length === 0) {
      console.log("No new tags to add")
      return
    }

    // Insert the new tags
    const formattedTags = tags.map(tagId => ({
      project_id: projectId,
      tag_id: tagId
    }))

    const { error: insertError } = await supabaseAdmin
      .from('project_tags')
      .insert(formattedTags)

    if (insertError) {
      console.error("Error inserting project tags:", insertError)
      throw insertError
    }

    console.log(`Successfully updated ${tags.length} tags for project ${projectId}`)
  } catch (error) {
    console.error("Error in updateProjectTags:", error)
    throw error
  }
} 