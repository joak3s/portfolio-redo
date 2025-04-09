/**
 * Test Chat Project Response Script
 * 
 * This script tests if project images are correctly returned in chat responses
 * by directly simulating the API request flow
 */

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import fs from 'fs';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Debug: Check if .env file exists and environment variables are loaded
console.log('Checking environment configuration...');
const envPath = path.resolve(__dirname, '../.env');
console.log(`.env file exists: ${fs.existsSync(envPath)}`);
console.log(`NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'defined' : 'undefined'}`);
console.log(`SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'defined' : 'undefined'}`);

// Check if required env vars are present
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables! Copy values from .env.local or .env file.');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testChatProjectResponse() {
  try {
    console.log('Testing project image display in chat responses...');
    
    // 1. Find a project to test with
    console.log('\n1. Finding a project with images to test...');
    const { data: projects, error: projectError } = await supabase
      .from('projects')
      .select('id, title, slug')
      .limit(10);
    
    if (projectError) {
      throw new Error(`Error fetching projects: ${projectError.message}`);
    }
    
    if (!projects || projects.length === 0) {
      throw new Error('No projects found in database');
    }
    
    console.log(`Found ${projects.length} projects`);
    
    // Find a project with images
    let projectWithImage = null;
    
    for (const project of projects) {
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
        break;
      }
    }
    
    if (!projectWithImage) {
      throw new Error('No projects with images found');
    }
    
    console.log(`Selected project: "${projectWithImage.title}" (${projectWithImage.id})`);
    console.log(`Project has image: ${projectWithImage.image_url}`);
    
    // 2. Create a session and test direct API calling with supabase.rpc
    console.log('\n2. Testing direct database flow with Supabase RPC...');
    
    // Create a test session
    const sessionKey = `test_${Date.now()}`;
    const { data: session, error: sessionError } = await supabase
      .from('conversation_sessions')
      .insert({
        session_key: sessionKey,
        title: 'Test Project Image Session'
      })
      .select('id')
      .single();
    
    if (sessionError) {
      throw new Error(`Error creating session: ${sessionError.message}`);
    }
    
    console.log(`Created session with ID: ${session.id}`);
    
    // Add a test message
    const { data: message, error: messageError } = await supabase
      .from('chat_history')
      .insert({
        session_id: session.id,
        role: 'assistant',
        content: `Here's information about the ${projectWithImage.title} project.`,
        response: `Here's information about the ${projectWithImage.title} project.`
      })
      .select('id')
      .single();
    
    if (messageError) {
      throw new Error(`Error creating message: ${messageError.message}`);
    }
    
    console.log(`Created chat message with ID: ${message.id}`);
    
    // Call the save_chat_project function directly
    console.log('\n3. Calling save_chat_project function...');
    const { data: saveResult, error: saveError } = await supabase.rpc(
      'save_chat_project',
      {
        p_message_id: message.id,
        p_project_id: projectWithImage.id,
        p_project_image: projectWithImage.image_url
      }
    );
    
    if (saveError) {
      console.error('Error from save_chat_project:', saveError);
      // Continue the test even if this fails
    } else {
      console.log('save_chat_project result:', saveResult);
    }
    
    // Check if the project was attached correctly
    const { data: linkCheck, error: linkCheckError } = await supabase
      .from('chat_projects')
      .select('*')
      .eq('message_id', message.id)
      .single();
    
    if (linkCheckError) {
      console.error('Error checking project link:', linkCheckError);
    } else {
      console.log('Project linked to message:', linkCheck);
    }
    
    // 3. Test retrieving the message with image
    console.log('\n4. Testing message retrieval with image...');
    
    // Retrieve the message directly
    const { data: retrievedMessage, error: retrieveError } = await supabase
      .from('chat_history')
      .select(`
        id,
        role,
        content,
        chat_projects (
          project_id,
          project_image
        )
      `)
      .eq('id', message.id)
      .single();
    
    if (retrieveError) {
      console.error('Error retrieving message:', retrieveError);
    } else {
      console.log('Retrieved message with projects:');
      console.log(JSON.stringify(retrievedMessage, null, 2));
      
      if (retrievedMessage.chat_projects && retrievedMessage.chat_projects.length > 0) {
        console.log('\n✅ Project image successfully attached to message!');
      } else {
        console.log('\n❌ No project data found in message');
      }
    }
    
    // 4. Test the actual chat API endpoint
    console.log('\n5. Testing actual chat API endpoint...');
    try {
      // Get the URL of your local/dev server
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const testPrompt = `Tell me about the ${projectWithImage.title} project`;
      
      console.log(`Sending request to API with prompt: "${testPrompt}"`);
      
      const response = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: testPrompt,
          sessionKey: `test_api_${Date.now()}`,
          includeHistory: false
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      console.log('API response received');
      console.log('Project info in response:', data.relevant_project ? 'YES ✓' : 'NO ✗');
      console.log('Project image in response:', data.project_image ? 'YES ✓' : 'NO ✗');
      
      if (data.project_image) {
        console.log(`Image URL: ${data.project_image}`);
      }
      
      // Check if the HTML response contains the image
      const imageInHtml = data.response.includes('<img');
      console.log('Image tag in HTML response:', imageInHtml ? 'YES ✓' : 'NO ✗');
      
      if (imageInHtml) {
        // Extract the image tag from the response for debugging
        const imgTagMatch = data.response.match(/<img[^>]+>/);
        if (imgTagMatch) {
          console.log('Image tag:', imgTagMatch[0]);
        }
      } else {
        console.log('\nFirst 200 chars of response:');
        console.log(data.response.substring(0, 200));
      }
      
      if (data.project_image && !imageInHtml) {
        console.log('\n❌ ISSUE FOUND: API returns project_image but HTML response does not include image tag');
        
        // Suggest solutions
        console.log('\nPossible solutions:');
        console.log('1. Verify that the OpenAI system message instructions include the image display instructions');
        console.log('2. Check that the HTML parsing in AIChat.tsx is correctly handling the <img> tag');
        console.log('3. Try updating the system prompt to emphasize showing the image tag in the response');
      } else if (!data.project_image) {
        console.log('\n❌ ISSUE FOUND: No project_image in API response');
        
        // Suggest solutions
        console.log('\nPossible solutions:');
        console.log('1. Check getProjectFirstImage function in route.ts to ensure it is correctly retrieving images');
        console.log('2. Verify findMostRelevantProject function in route.ts is identifying the correct project');
        console.log('3. Check that project_images table has the correct URLs stored');
      } else if (data.project_image && imageInHtml) {
        console.log('\n✅ Everything looks good: API returns project_image and HTML response includes image tag');
      }
    } catch (error) {
      console.error('Error testing API:', error);
    }
    
    console.log('\nTest completed. Check the results above for troubleshooting.');
    
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testChatProjectResponse().catch(console.error); 