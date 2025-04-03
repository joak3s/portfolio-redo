import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create Supabase client
// For server-side components, we can access the service role key
// Otherwise fallback to anon key
const supabaseKey = typeof window === 'undefined' 
  ? process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey
  : supabaseAnonKey;

const supabase = createClient(supabaseUrl, supabaseKey);

// Check if we have valid credentials
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Check your environment variables.');
}

export interface UploadImageOptions {
  file: File;
  bucket?: string;
  folder?: string;
}

/**
 * Uploads an image to Supabase storage and returns the public URL
 * @param options Options for uploading the image
 * @returns The public URL of the uploaded image
 */
export async function uploadImage({ 
  file, 
  bucket = 'public', 
  folder = 'journey_milestones' 
}: UploadImageOptions): Promise<string> {
  try {
    console.log(`Attempting to upload to bucket '${bucket}', folder '${folder}'`);
    
    // Validate file type
    const acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!acceptedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload a JPEG, PNG, GIF, WEBP, or SVG image.');
    }
    
    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('File size exceeds the 5MB limit.');
    }

    // Generate a unique filename
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    console.log(`Uploading file: ${fileName} to path: ${filePath}`);

    // Verify the Supabase client has been properly initialized
    if (!supabase || !supabase.storage) {
      throw new Error('Supabase client not properly initialized. Check your environment variables.');
    }

    // This function will only be called from a server action or API route
    // So we can try to use a server-side approach to upload
    let uploadResponse;
    
    // Browser/client uploads will still go through the regular API
    if (typeof window !== 'undefined') {
      // Client-side upload with anon key (normal flow)
      uploadResponse = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: true 
        });
    } else {
      // Server-side upload with service role key (should have full permissions)
      const serviceClient = createClient(
        supabaseUrl, 
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      uploadResponse = await serviceClient.storage
        .from(bucket)
        .upload(filePath, file, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: true
        });
    }
    
    const { data, error } = uploadResponse;

    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error(`Error uploading image: ${error.message}`);
    }

    // Get public URL for the file
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    console.log(`Upload successful. Public URL: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
} 