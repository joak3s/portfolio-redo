/**
 * Simplified Project Image Test 
 * Directly uses env vars loaded by test-with-local-env.js
 */

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

console.log('Environment variables loaded:');
console.log(`- Supabase URL: ${supabaseUrl ? '✓' : '✗'}`);
console.log(`- Supabase Key: ${supabaseKey ? '✓' : '✗'}`);
console.log(`- API URL: ${apiUrl}`);

// Verify environment variables
if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: Missing required environment variables!');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function testProjectImage() {
  try {
    console.log('\nSearching for a project with images...');
    
    // 1. Get a list of projects
    const { data: projects, error: projectError } = await supabase
      .from('projects')
      .select('id, title, slug')
      .limit(10);
    
    if (projectError) {
      throw new Error(`Error fetching projects: ${projectError.message}`);
    }
    
    console.log(`Found ${projects.length} projects`);
    
    // 2. Find a project with an image
    let projectWithImage = null;
    
    for (const project of projects) {
      console.log(`Checking project: ${project.title} (${project.id})`);
      
      const { data: images } = await supabase
        .from('project_images')
        .select('id, url')
        .eq('project_id', project.id)
        .limit(1);
      
      if (images && images.length > 0) {
        projectWithImage = {
          ...project,
          image_url: images[0].url
        };
        console.log(`✓ Found image for project: ${images[0].url}`);
        break;
      } else {
        console.log(`✗ No images found for this project`);
      }
    }
    
    if (!projectWithImage) {
      throw new Error('No projects with images found!');
    }
    
    // 3. Test the API with this project
    console.log(`\nTesting chat API with project: ${projectWithImage.title}`);
    
    try {
      const testPrompt = `Tell me about the ${projectWithImage.title} project`;
      console.log(`Query: "${testPrompt}"`);
      
      // Make the API request
      console.log(`Calling API at: ${apiUrl}/api/chat`);
      const response = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: testPrompt,
          sessionKey: `test_${Date.now()}`,
          includeHistory: false
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      // Parse the response
      const data = await response.json();
      console.log('\nAPI Response Summary:');
      console.log(`- Response length: ${data.response ? data.response.length : 0} characters`);
      console.log(`- Project detected: ${data.relevant_project ? '✓' : '✗'}`);
      console.log(`- Project image: ${data.project_image ? '✓' : '✗'}`);
      
      if (data.project_image) {
        console.log(`- Image URL: ${data.project_image}`);
      }
      
      // Check if the image tag is present in the HTML
      const imageTagPresent = data.response && data.response.includes('<img');
      console.log(`- Image tag in HTML: ${imageTagPresent ? '✓' : '✗'}`);
      
      // Extract and log the image tag if present
      if (imageTagPresent) {
        const imgTagMatch = data.response.match(/<img[^>]+>/);
        if (imgTagMatch) {
          console.log(`\nImage tag: ${imgTagMatch[0]}`);
        }
      }
      
      // Log the first part of the response
      console.log('\nResponse preview:');
      console.log('----------------------------------------------------------------');
      console.log(data.response ? data.response.substring(0, 500) + '...' : 'No response');
      console.log('----------------------------------------------------------------');
      
      // Display diagnosis
      console.log('\n📊 Diagnosis:');
      
      if (!data.relevant_project) {
        console.log('❌ Problem: The API did not detect a relevant project.');
        console.log('   Solution: Check findMostRelevantProject function in route.ts');
      } else if (!data.project_image) {
        console.log('❌ Problem: Project detected but no image URL was returned.');
        console.log('   Solution: Check getProjectFirstImage function in route.ts');
      } else if (!imageTagPresent) {
        console.log('❌ Problem: Image URL present but not included in HTML response.');
        console.log('   - Check systemMessageContent in route.ts to ensure it includes image display instructions');
        console.log('   - The OpenAI model may not be following instructions to include an image');
        console.log('   - Try modifying the system prompt to emphasize including the image tag');
      } else {
        console.log('✅ Everything looks good! The image should be displayed in the chat.');
        console.log('   If it\'s still not showing in the frontend, check AIChat.tsx component');
        console.log('   Make sure it correctly renders HTML content with <img> tags');
      }
      
    } catch (error) {
      console.error('API test error:', error.message);
    }
    
    console.log('\nTest completed.');
    
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testProjectImage().catch(console.error); 