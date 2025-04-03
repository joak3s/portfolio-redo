// Script to test Supabase storage configuration
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Output environment info
console.log(`
Testing Supabase Storage Configuration
-------------------------------------
URL: ${supabaseUrl}
ANON KEY: ${supabaseKey ? '[Set]' : '[Not Set]'}
SERVICE KEY: ${serviceRoleKey ? '[Set]' : '[Not Set]'}
`);

// Create clients with both keys for testing
const supabaseAnon = createClient(supabaseUrl, supabaseKey);
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

async function testBucketExists(client: any, name: string, role: string) {
  try {
    const { data, error } = await client.storage.listBuckets();
    
    console.log(`[${role}] Listing buckets:`);
    if (error) {
      console.error(`  Error: ${error.message}`);
      return false;
    }
    
    if (!data || data.length === 0) {
      console.log('  No buckets found');
      return false;
    }
    
    console.log(`  Found ${data.length} buckets:`);
    data.forEach((bucket: any) => {
      console.log(`  - ${bucket.name} (${bucket.id}) - Public: ${bucket.public}`);
    });
    
    const bucketExists = data.some((bucket: any) => bucket.id === name);
    console.log(`  '${name}' bucket ${bucketExists ? 'exists' : 'does not exist'}`);
    
    return bucketExists;
  } catch (error: any) {
    console.error(`  Error checking bucket: ${error.message}`);
    return false;
  }
}

async function testUploadPermissions(client: any, bucketName: string, role: string) {
  try {
    // Create a small test file
    const testFilePath = path.join(__dirname, 'test-upload.txt');
    fs.writeFileSync(testFilePath, 'This is a test file for Supabase storage.');
    
    console.log(`[${role}] Testing upload to '${bucketName}' bucket...`);
    
    // Try to upload the file
    const testFile = fs.readFileSync(testFilePath);
    const { data, error } = await client.storage
      .from(bucketName)
      .upload(`test-${Date.now()}.txt`, testFile, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) {
      console.error(`  Upload failed: ${error.message}`);
      return false;
    }
    
    console.log(`  Upload successful: ${data?.path}`);
    
    // Clean up
    fs.unlinkSync(testFilePath);
    return true;
  } catch (error: any) {
    console.error(`  Error testing upload: ${error.message}`);
    return false;
  }
}

async function testBucketPolicy(client: any, bucketName: string, role: string) {
  try {
    console.log(`[${role}] Testing policies for '${bucketName}' bucket...`);
    
    // List files (tests SELECT policy)
    const { data: files, error: listError } = await client.storage
      .from(bucketName)
      .list();
    
    if (listError) {
      console.error(`  List failed: ${listError.message}`);
    } else {
      console.log(`  List successful: ${files?.length} files found`);
    }
    
    return !listError;
  } catch (error: any) {
    console.error(`  Error testing policies: ${error.message}`);
    return false;
  }
}

async function main() {
  try {
    console.log('TESTING WITH ANON KEY:');
    const anonBucketExists = await testBucketExists(supabaseAnon, 'public', 'ANON');
    let anonUploadWorks = false;
    let anonPolicyWorks = false;
    
    if (anonBucketExists) {
      anonUploadWorks = await testUploadPermissions(supabaseAnon, 'public', 'ANON');
      anonPolicyWorks = await testBucketPolicy(supabaseAnon, 'public', 'ANON');
    }
    
    console.log('\nTESTING WITH SERVICE ROLE KEY:');
    const adminBucketExists = await testBucketExists(supabaseAdmin, 'public', 'ADMIN');
    let adminUploadWorks = false;
    let adminPolicyWorks = false;
    
    if (adminBucketExists) {
      adminUploadWorks = await testUploadPermissions(supabaseAdmin, 'public', 'ADMIN');
      adminPolicyWorks = await testBucketPolicy(supabaseAdmin, 'public', 'ADMIN');
    }
    
    console.log('\nSUMMARY:');
    console.log(`Bucket exists:    ANON=${anonBucketExists}, ADMIN=${adminBucketExists}`);
    console.log(`Upload works:     ANON=${anonUploadWorks}, ADMIN=${adminUploadWorks}`);
    console.log(`Policies work:    ANON=${anonPolicyWorks}, ADMIN=${adminPolicyWorks}`);
    
    if (!anonBucketExists && !adminBucketExists) {
      console.log('\nRECOMMENDATION: The public bucket doesn\'t exist. Run the fix-storage-permissions.sql script.');
    } else if (!anonUploadWorks && adminUploadWorks) {
      console.log('\nRECOMMENDATION: Bucket exists but anon uploads fail. Check RLS policies.');
    } else if (!anonUploadWorks && !adminUploadWorks) {
      console.log('\nRECOMMENDATION: All uploads fail. Check bucket configuration and network connectivity.');
    } else if (anonUploadWorks) {
      console.log('\nRECOMMENDATION: Storage appears to be working! If you\'re still having issues, check front-end code.');
    }
  } catch (error: any) {
    console.error('Test failed:', error.message);
  }
}

main(); 