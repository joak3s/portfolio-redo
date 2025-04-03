// Script to fix Supabase storage using the service role key
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Get Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// Create admin client with service role key
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function fixStorage() {
  try {
    console.log('Fixing Supabase storage configuration...');
    
    // Check if public bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError.message);
      return;
    }
    
    console.log(`Found ${buckets.length} buckets`);
    buckets.forEach(bucket => {
      console.log(`- ${bucket.name} (${bucket.id})`);
    });
    
    // See if public bucket exists
    const publicBucket = buckets.find(b => b.id === 'public');
    
    if (publicBucket) {
      console.log('Public bucket already exists, updating configuration...');
      
      // Update bucket configuration
      const { error: updateError } = await supabase.storage.updateBucket('public', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: [
          'image/jpeg',
          'image/png',
          'image/gif', 
          'image/webp',
          'image/svg+xml'
        ]
      });
      
      if (updateError) {
        console.error('Error updating bucket:', updateError.message);
        return;
      }
      
      console.log('Public bucket updated successfully');
    } else {
      console.log('Creating public bucket...');
      
      // Create public bucket
      const { error: createError } = await supabase.storage.createBucket('public', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: [
          'image/jpeg',
          'image/png',
          'image/gif', 
          'image/webp',
          'image/svg+xml'
        ]
      });
      
      if (createError) {
        console.error('Error creating bucket:', createError.message);
        return;
      }
      
      console.log('Public bucket created successfully');
    }
    
    // Test uploading a file
    console.log('Testing upload to public bucket...');
    
    // Create a test JPEG file (minimal valid JPEG)
    const jpegHeader = new Uint8Array([
      0xFF, 0xD8, // SOI marker
      0xFF, 0xE0, // APP0 marker
      0x00, 0x10, // APP0 length (16 bytes)
      0x4A, 0x46, 0x49, 0x46, 0x00, // Identifier: "JFIF\0"
      0x01, 0x01, // Version 1.1
      0x00, // Density units: 0 (no units)
      0x00, 0x01, // X density: 1
      0x00, 0x01, // Y density: 1
      0x00, 0x00  // Thumbnail: 0×0
    ]);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('public')
      .upload('test-file.jpg', jpegHeader, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: true
      });
    
    if (uploadError) {
      console.error('Upload test failed:', uploadError.message);
      return;
    }
    
    console.log('Upload test successful:', uploadData.path);
    console.log('Storage configuration is now fixed!');
    
    // Now test specifically with the journey_milestones folder
    console.log('\nTesting journey_milestones folder...');
    
    const { data: folderData, error: folderError } = await supabase.storage
      .from('public')
      .upload('journey_milestones/test-file.jpg', jpegHeader, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: true
      });
    
    if (folderError) {
      console.error('Journey milestone folder test failed:', folderError.message);
      return;
    }
    
    console.log('Journey milestone folder test successful!');
    
  } catch (error: any) {
    console.error('Unexpected error:', error.message);
  }
}

fixStorage(); 