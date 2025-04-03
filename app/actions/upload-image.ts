'use server';

import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Server action to upload an image to Supabase storage
 * @param formData FormData containing the file
 * @returns URL of the uploaded image or throws an error
 */
export async function uploadImageToSupabase(formData: FormData): Promise<string> {
  try {
    console.log('Starting image upload process');
    
    // Get the file from form data
    const file = formData.get('file') as File;
    
    if (!file) {
      console.error('No file provided in FormData');
      throw new Error('No file provided');
    }
    
    console.log('Received file:', {
      name: file.name,
      type: file.type,
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
    });
    
    // Validate file type
    const acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!acceptedTypes.includes(file.type)) {
      console.error('Invalid file type:', file.type);
      throw new Error('Invalid file type. Please upload a JPEG, PNG, GIF, WEBP, or SVG image.');
    }
    
    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      console.error('File too large:', `${(file.size / 1024 / 1024).toFixed(2)}MB`);
      throw new Error('File size exceeds the 5MB limit.');
    }
    
    // Get Supabase credentials
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials');
      throw new Error('Server configuration error');
    }
    
    // Create a client with the service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Generate a unique filename
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${uuidv4()}.${fileExt}`;
    
    // Use a consistent storage path for all journey entries
    const filePath = `journey/${fileName}`;
    
    console.log('Uploading to path:', filePath);
    
    // Convert the file to array buffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    
    // Upload file to Supabase storage
    const { data, error } = await supabase.storage
      .from('public')
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error(`Error uploading image: ${error.message}`);
    }
    
    if (!data?.path) {
      console.error('Upload successful but no path returned');
      throw new Error('Upload successful but no path returned');
    }
    
    // Get public URL for the file
    const { data: { publicUrl } } = supabase.storage
      .from('public')
      .getPublicUrl(data.path);
    
    console.log('Upload successful, public URL:', publicUrl);
    
    return publicUrl;
  } catch (error: any) {
    console.error('Server action upload error:', error);
    throw new Error(error.message || 'Error uploading image');
  }
} 