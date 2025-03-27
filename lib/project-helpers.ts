import { supabaseAdmin } from '@/lib/supabase-admin'
import type { ProjectImage, ProjectUpdate } from '@/lib/types'

/**
 * Update project images in the database
 */
export async function updateProjectImages(
  projectId: string,
  images: ProjectUpdate['images']
) {
  console.log('Updating project images for project:', projectId);
  
  try {
    if (!projectId) {
      console.error('Missing projectId in updateProjectImages');
      throw new Error('Project ID is required');
    }
    
    if (!images) {
      console.log('No images to update for project:', projectId);
      return; // Nothing to do
    }
    
    // Validate image data
    const validatedImages = images.filter(img => {
      if (!img || typeof img !== 'object') {
        console.warn('Invalid image object:', img);
        return false; 
      }
      
      if (!img.url || typeof img.url !== 'string') {
        console.warn('Image missing URL or invalid URL type:', img);
        return false;
      }
      
      return true;
    });
    
    console.log(`Processing ${validatedImages.length} valid images for project ${projectId}`);
    
    // Delete existing images
    const { error: deleteError } = await supabaseAdmin
      .from('project_images')
      .delete()
      .eq('project_id', projectId)
    
    if (deleteError) {
      console.error('Error deleting project images:', deleteError)
      throw new Error(`Failed to delete existing images: ${deleteError.message}`)
    }
    
    // Insert new images if there are any
    if (validatedImages.length > 0) {
      const imagesToInsert = validatedImages.map((image, index) => ({
        project_id: projectId,
        url: image.url,
        alt_text: image.alt_text || '',
        order_index: image.order_index !== undefined ? image.order_index : index
      }));
      
      const { error: insertError } = await supabaseAdmin
        .from('project_images')
        .insert(imagesToInsert)
      
      if (insertError) {
        console.error('Error inserting project images:', insertError)
        throw new Error(`Failed to insert new images: ${insertError.message}`)
      }
      
      console.log(`Successfully updated ${validatedImages.length} images for project ${projectId}`);
    }
  } catch (error) {
    console.error('Error in updateProjectImages:', error);
    throw error;
  }
}

/**
 * Update project tools in the database
 */
export async function updateProjectTools(
  projectId: string,
  toolIds: ProjectUpdate['tool_ids']
) {
  console.log('Updating project tools for project:', projectId);
  
  try {
    if (!projectId) {
      console.error('Missing projectId in updateProjectTools');
      throw new Error('Project ID is required');
    }
    
    if (!toolIds) {
      console.log('No tools to update for project:', projectId);
      return; // Nothing to do
    }
    
    // Validate tool IDs
    const validatedToolIds = toolIds.filter(id => id && typeof id === 'string');
    
    console.log(`Processing ${validatedToolIds.length} valid tools for project ${projectId}`);
    
    // Delete existing tools
    const { error: deleteError } = await supabaseAdmin
      .from('project_tools')
      .delete()
      .eq('project_id', projectId)
    
    if (deleteError) {
      console.error('Error deleting project tools:', deleteError)
      throw new Error(`Failed to delete existing tools: ${deleteError.message}`)
    }
    
    // Insert new tools if there are any
    if (validatedToolIds.length > 0) {
      const toolsToInsert = validatedToolIds.map(toolId => ({
        project_id: projectId,
        tool_id: toolId
      }));
      
      const { error: insertError } = await supabaseAdmin
        .from('project_tools')
        .insert(toolsToInsert)
      
      if (insertError) {
        console.error('Error inserting project tools:', insertError)
        throw new Error(`Failed to insert new tools: ${insertError.message}`)
      }
      
      console.log(`Successfully updated ${validatedToolIds.length} tools for project ${projectId}`);
    }
  } catch (error) {
    console.error('Error in updateProjectTools:', error);
    throw error;
  }
}

/**
 * Update project tags in the database
 */
export async function updateProjectTags(
  projectId: string,
  tagIds: ProjectUpdate['tag_ids']
) {
  console.log('Updating project tags for project:', projectId);
  
  try {
    if (!projectId) {
      console.error('Missing projectId in updateProjectTags');
      throw new Error('Project ID is required');
    }
    
    if (!tagIds) {
      console.log('No tags to update for project:', projectId);
      return; // Nothing to do
    }
    
    // Validate tag IDs
    const validatedTagIds = tagIds.filter(id => id && typeof id === 'string');
    
    console.log(`Processing ${validatedTagIds.length} valid tags for project ${projectId}`);
    
    // Delete existing tags
    const { error: deleteError } = await supabaseAdmin
      .from('project_tags')
      .delete()
      .eq('project_id', projectId)
    
    if (deleteError) {
      console.error('Error deleting project tags:', deleteError)
      throw new Error(`Failed to delete existing tags: ${deleteError.message}`)
    }
    
    // Insert new tags if there are any
    if (validatedTagIds.length > 0) {
      const tagsToInsert = validatedTagIds.map(tagId => ({
        project_id: projectId,
        tag_id: tagId
      }));
      
      const { error: insertError } = await supabaseAdmin
        .from('project_tags')
        .insert(tagsToInsert)
      
      if (insertError) {
        console.error('Error inserting project tags:', insertError)
        throw new Error(`Failed to insert new tags: ${insertError.message}`)
      }
      
      console.log(`Successfully updated ${validatedTagIds.length} tags for project ${projectId}`);
    }
  } catch (error) {
    console.error('Error in updateProjectTags:', error);
    throw error;
  }
} 