// Verification script for Supabase storage uploads
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Get Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !anonKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// Create anon client - this is what the browser uses
const supabase = createClient(supabaseUrl, anonKey);

async function verifyStorageAccess() {
  try {
    console.log('Verifying Supabase storage access...');
    console.log(`Using URL: ${supabaseUrl}`);
    
    // Create a small JPEG test file
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
    
    // Save it to a temp file to simulate a File object
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, 'test-upload.jpg');
    fs.writeFileSync(tempFilePath, jpegHeader);
    
    // Prepare the file for upload
    const fileBuffer = fs.readFileSync(tempFilePath);
    
    console.log('Testing upload to public bucket with anon key...');
    
    // Test upload to the root of the public bucket
    const { data: rootData, error: rootError } = await supabase.storage
      .from('public')
      .upload(`test-${Date.now()}.jpg`, fileBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: true
      });
    
    if (rootError) {
      console.error('Root upload failed:', rootError.message);
    } else {
      console.log('Root upload successful:', rootData.path);
    }
    
    // Test upload to the journey_milestones folder - this is what the app does
    console.log('\nTesting upload to journey_milestones folder...');
    const { data: folderData, error: folderError } = await supabase.storage
      .from('public')
      .upload(`journey_milestones/test-${Date.now()}.jpg`, fileBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: true
      });
    
    if (folderError) {
      console.error('Folder upload failed:', folderError.message);
    } else {
      console.log('Folder upload successful:', folderData.path);
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('public')
        .getPublicUrl(folderData.path);
      
      console.log('Public URL:', publicUrl);
    }
    
    // Clean up
    fs.unlinkSync(tempFilePath);
    
    // Summary
    if (!rootError && !folderError) {
      console.log('\n✅ SUCCESS: Storage is working correctly!');
      console.log('The Journey Milestone image upload should now work in your application.');
      console.log('You may need to restart your Next.js application for changes to take effect.');
    } else {
      console.log('\n❌ ISSUE: Some storage operations failed.');
      console.log('Check the error messages above for more details.');
    }
    
  } catch (error: any) {
    console.error('Unexpected error:', error.message);
  }
}

verifyStorageAccess(); 