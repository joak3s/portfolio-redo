'use server';

import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { type JourneyEntry, type JourneyEntryCreate, type JourneyEntryUpdate } from '@/lib/types/journey';

interface CreateJourneyInput {
  title: string;
  year: string;
  description: string;
  skills: string[];
  icon: string;
  color: string;
  display_order: number;
  image_url?: string;
}

/**
 * Server action to create a journey entry
 * This handles the journey entry creation (image should be uploaded separately)
 */
export async function createJourneyEntry(
  data: CreateJourneyInput
): Promise<{ success: boolean; data?: JourneyEntry; error?: string }> {
  try {
    console.log('Creating journey entry with data:', {
      title: data.title,
      year: data.year,
      skills: data.skills?.length || 0,
      hasImageUrl: !!data.image_url
    });
    
    // Get Supabase credentials with service role for full permissions
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials');
      throw new Error('Missing Supabase credentials');
    }
    
    // Create a client with the service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Validate required fields
    if (!data.title || !data.year || !data.description || 
        !data.skills || !data.skills.length || !data.icon || !data.color) {
      console.error('Missing required fields:', { 
        title: !data.title, 
        year: !data.year,
        description: !data.description,
        skills: !data.skills || !data.skills.length,
        icon: !data.icon,
        color: !data.color
      });
      throw new Error('Missing required fields');
    }
    
    // Create journey entry
    console.log('Creating journey entry in database');
    const { data: journeyData, error: journeyError } = await supabase.rpc(
      'create_journey',
      {
        p_title: data.title,
        p_year: data.year,
        p_description: data.description,
        p_skills: data.skills,
        p_icon: data.icon,
        p_color: data.color,
        p_display_order: data.display_order
      }
    );
    
    if (journeyError) {
      console.error('Error creating journey entry:', journeyError);
      throw new Error(`Failed to create journey entry: ${journeyError.message}`);
    }
    
    console.log('Journey entry created with ID:', journeyData.id);
    
    // If we have an image URL, associate it with the journey entry
    if (data.image_url) {
      console.log('Adding image to journey entry');
      const { error: imageError } = await supabase.rpc(
        'add_journey_image',
        {
          p_journey_id: journeyData.id,
          p_url: data.image_url,
          p_order_index: 1
        }
      );
      
      if (imageError) {
        console.error('Error adding journey image:', imageError);
        // We don't throw here, as the journey entry was created successfully
      } else {
        console.log('Image added successfully to journey entry');
      }
    }
    
    return {
      success: true,
      data: journeyData
    };
    
  } catch (error: any) {
    console.error('Server action error:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred'
    };
  }
}

/**
 * Server action to update a journey entry
 */
export async function updateJourneyEntry(
  id: string,
  data: Partial<CreateJourneyInput>
): Promise<{ success: boolean; data?: JourneyEntry; error?: string }> {
  try {
    console.log('Updating journey entry with ID:', id);
    
    // Get Supabase credentials with service role for full permissions
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials');
      throw new Error('Missing Supabase credentials');
    }
    
    // Create a client with the service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // First, update the journey entry
    console.log('Updating journey entry data');
    const updateData: any = {};
    if (data.title) updateData.title = data.title;
    if (data.year) updateData.year = data.year;
    if (data.description) updateData.description = data.description;
    if (data.skills) updateData.skills = data.skills;
    if (data.icon) updateData.icon = data.icon;
    if (data.color) updateData.color = data.color;
    if (data.display_order !== undefined) updateData.display_order = data.display_order;
    
    const { data: journeyData, error: updateError } = await supabase
      .from('journey')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();
    
    if (updateError) {
      console.error('Error updating journey entry:', updateError);
      throw new Error(`Failed to update journey entry: ${updateError.message}`);
    }
    
    console.log('Journey entry updated successfully');
    
    // If we have a new image URL, add it to journey_images
    if (data.image_url) {
      console.log('Adding new image to updated journey entry');
      // First, get current images to determine highest order_index
      const { data: existingImages, error: fetchError } = await supabase
        .from('journey_images')
        .select('order_index')
        .eq('journey_id', id)
        .order('order_index', { ascending: false });
      
      if (fetchError) {
        console.error('Error fetching existing images:', fetchError);
      }
      
      const nextOrderIndex = existingImages && existingImages.length > 0 
        ? existingImages[0].order_index + 1 
        : 1;
      
      console.log('Adding image with order index:', nextOrderIndex);
      const { error: imageError } = await supabase
        .from('journey_images')
        .insert({
          journey_id: id,
          url: data.image_url,
          order_index: nextOrderIndex
        });
      
      if (imageError) {
        console.error('Error adding journey image:', imageError);
      } else {
        console.log('Image added successfully to updated journey entry');
      }
    }
    
    return {
      success: true,
      data: journeyData
    };
    
  } catch (error: any) {
    console.error('Server action error:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred'
    };
  }
}

/**
 * Server action to delete a journey entry
 */
export async function deleteJourneyEntry(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('Deleting journey entry with ID:', id);
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials');
      throw new Error('Missing Supabase credentials');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // First, delete any associated images from journey_images
    console.log('Deleting associated images');
    const { error: imagesError } = await supabase
      .from('journey_images')
      .delete()
      .eq('journey_id', id);
    
    if (imagesError) {
      console.error('Error deleting journey images:', imagesError);
      // Continue with deletion even if image deletion fails
    } else {
      console.log('Journey images deleted successfully');
    }
    
    // Then delete the journey entry
    console.log('Deleting journey entry');
    const { error: deleteError } = await supabase
      .from('journey')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      console.error('Error deleting journey entry:', deleteError);
      throw new Error(`Failed to delete journey entry: ${deleteError.message}`);
    }
    
    console.log('Journey entry deleted successfully');
    return {
      success: true
    };
    
  } catch (error: any) {
    console.error('Server action error:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred'
    };
  }
} 