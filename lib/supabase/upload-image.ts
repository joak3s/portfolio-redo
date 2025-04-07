'use client'

import { v4 as uuidv4 } from 'uuid';
import { supabaseClient } from '../supabase';

export interface UploadImageOptions {
  file: File;
  bucket?: string;
  folder?: string;
  projectId?: string; // Added support for project-specific uploads
}

export interface ImageMetadata {
  url: string;
  path: string;
  alt?: string;
}

/**
 * Uploads an image to Supabase storage and returns the public URL and metadata
 * Can be used for any image upload needs (projects, journey milestones, etc.)
 * 
 * @param options Options for uploading the image
 * @returns Image metadata including URL, path, and alt text
 */
export async function uploadImage({ 
  file, 
  bucket = 'public', 
  folder = 'images',
  projectId
}: UploadImageOptions): Promise<ImageMetadata> {
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
    
    // Create path based on folder and optional projectId
    let filePath;
    if (projectId) {
      filePath = `${folder}/${projectId}/${uuidv4()}.${fileExt}`;
    } else {
      filePath = `${folder}/${uuidv4()}.${fileExt}`;
    }

    console.log(`Uploading file: ${file.name} to path: ${filePath}`);

    // Upload the file using the browser client
    const { data, error } = await supabaseClient.storage
      .from(bucket)
      .upload(filePath, file, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true 
      });

    if (error) {
      console.error('Storage upload error:', error);
      throw new Error(`Error uploading image: ${error.message}`);
    }

    // Get public URL for the file
    const { data: { publicUrl } } = supabaseClient.storage
      .from(bucket)
      .getPublicUrl(filePath);

    console.log(`Upload successful. Public URL: ${publicUrl}`);
    
    // Return full metadata
    return {
      url: publicUrl,
      path: filePath,
      alt: file.name.split('.')[0] // Use filename as alt text
    };
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}

/**
 * Deletes an image from Supabase storage
 * 
 * @param path Path to the image in the bucket
 * @param bucket Storage bucket name
 */
export async function deleteImage(path: string, bucket = 'public') {
  try {
    const { error } = await supabaseClient.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
    
    console.log(`Successfully deleted image: ${path}`);
    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
} 