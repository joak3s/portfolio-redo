// Script to fix anonymous permissions for the public bucket
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

async function fixPermissions() {
  try {
    console.log('Fixing anonymous permissions for the public bucket...');
    
    // First, ensure public bucket is properly configured
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
    
    console.log('Public bucket configuration updated');
    
    // Execute SQL to fix RLS policies
    const { error: rpcError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Drop existing policies
        DROP POLICY IF EXISTS "Public Access" ON storage.objects;
        DROP POLICY IF EXISTS "Upload Access" ON storage.objects;
        DROP POLICY IF EXISTS "Owner Update Access" ON storage.objects;
        DROP POLICY IF EXISTS "Owner Delete Access" ON storage.objects;
        
        -- Create more permissive policies
        CREATE POLICY "Public Access" ON storage.objects
          FOR SELECT USING (bucket_id = 'public');
        
        CREATE POLICY "Upload Access" ON storage.objects
          FOR INSERT WITH CHECK (
            bucket_id = 'public'
            -- Remove role check to allow anyone to upload
          );
        
        CREATE POLICY "Owner Update Access" ON storage.objects
          FOR UPDATE USING (
            bucket_id = 'public'
          );
        
        CREATE POLICY "Owner Delete Access" ON storage.objects
          FOR DELETE USING (
            bucket_id = 'public'
          );
      `
    });
    
    if (rpcError) {
      console.error('Error executing SQL:', rpcError.message);
      
      // Try alternative approach - create custom function
      console.log('Trying alternative approach...');
      
      // Define the function
      const { error: createFnError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE OR REPLACE FUNCTION fix_storage_permissions()
          RETURNS void AS $$
          BEGIN
            -- Drop existing policies
            DROP POLICY IF EXISTS "Public Access" ON storage.objects;
            DROP POLICY IF EXISTS "Upload Access" ON storage.objects;
            DROP POLICY IF EXISTS "Owner Update Access" ON storage.objects;
            DROP POLICY IF EXISTS "Owner Delete Access" ON storage.objects;
            
            -- Create more permissive policies
            CREATE POLICY "Public Access" ON storage.objects
              FOR SELECT USING (bucket_id = 'public');
            
            CREATE POLICY "Upload Access" ON storage.objects
              FOR INSERT WITH CHECK (bucket_id = 'public');
            
            CREATE POLICY "Owner Update Access" ON storage.objects
              FOR UPDATE USING (bucket_id = 'public');
            
            CREATE POLICY "Owner Delete Access" ON storage.objects
              FOR DELETE USING (bucket_id = 'public');
          END;
          $$ LANGUAGE plpgsql;
        `
      });
      
      if (createFnError) {
        console.error('Error creating function:', createFnError.message);
        console.log('\nPlease run the following SQL directly through the Supabase dashboard:');
        console.log(`
-- Fix storage permissions
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Upload Access" ON storage.objects;
DROP POLICY IF EXISTS "Owner Update Access" ON storage.objects;
DROP POLICY IF EXISTS "Owner Delete Access" ON storage.objects;

CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'public');

CREATE POLICY "Upload Access" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'public');

CREATE POLICY "Owner Update Access" ON storage.objects
  FOR UPDATE USING (bucket_id = 'public');

CREATE POLICY "Owner Delete Access" ON storage.objects
  FOR DELETE USING (bucket_id = 'public');
        `);
        return;
      }
      
      // Execute the function
      const { error: execFnError } = await supabase.rpc('fix_storage_permissions');
      
      if (execFnError) {
        console.error('Error executing function:', execFnError.message);
        return;
      }
    }
    
    console.log('Storage permissions updated successfully');
    console.log('\nYour application should now be able to upload images to the public bucket.');
    console.log('Please restart your Next.js application to apply the changes.');
    
  } catch (error: any) {
    console.error('Unexpected error:', error.message);
  }
}

fixPermissions(); 