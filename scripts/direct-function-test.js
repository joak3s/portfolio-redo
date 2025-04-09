import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

// Print out environment variables to debug
console.log("SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "✓ defined" : "✗ missing");
console.log("SUPABASE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "✓ defined" : "✗ missing");

// Initialize Supabase client with explicit values to avoid undefined
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing required environment variables!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test the database function directly
async function testGetContentById() {
  try {
    // Modern Day Sniper project ID
    const projectId = '8b1b2fcc-638f-444d-b98c-a9f12ee651e5';
    
    console.log(`Testing get_content_by_id function with project ID: ${projectId}\n`);
    
    // Call the function directly
    const { data, error } = await supabase.rpc('get_content_by_id', {
      p_content_id: projectId,
      p_content_type: 'project'
    });
    
    if (error) {
      console.error('Error calling function:', error);
      return;
    }
    
    console.log('Function result:');
    console.log(JSON.stringify(data, null, 2));
    
    // Check for image data
    console.log('\nChecking image data:');
    if (data.image_url) {
      console.log(`Image URL: ${data.image_url}`);
    } else {
      console.log('No image URL found');
    }
    
    if (data.gallery_images && data.gallery_images.length > 0) {
      console.log(`Gallery images: ${data.gallery_images.length}`);
      console.log('First gallery image:', data.gallery_images[0]);
    } else {
      console.log('No gallery images found');
    }
    
    // Test a direct database query to get project images
    console.log('\nQuerying project_images table directly:');
    const { data: imageData, error: imageError } = await supabase
      .from('project_images')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true });
    
    if (imageError) {
      console.error('Error querying images:', imageError);
      return;
    }
    
    console.log(`Found ${imageData.length} images directly from table`);
    if (imageData.length > 0) {
      console.log('First image URL:', imageData[0].url);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testGetContentById(); 