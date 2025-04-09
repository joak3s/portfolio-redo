/**
 * Debug Project Image Issue
 * 
 * This script diagnoses why project images aren't showing in chat responses
 * without requiring the API to be running
 */

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(rootDir, '.env.local') });

// Get required env vars
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables!');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseProblem() {
  try {
    console.log('📊 Diagnosing project image display issue...');
    
    // 1. Find a project with images
    console.log('\n1️⃣ Finding a project with images...');
    const { data: projects, error: projectError } = await supabase
      .from('projects')
      .select('id, title, slug')
      .limit(5);
    
    if (projectError) {
      throw new Error(`Error fetching projects: ${projectError.message}`);
    }
    
    console.log(`Found ${projects.length} projects`);
    
    // Find project with images
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
    
    console.log(`Using project: ${projectWithImage.title} (${projectWithImage.id})`);
    console.log(`Project has image URL: ${projectWithImage.image_url}`);
    
    // 2. Test the project-message-image link flow
    console.log('\n2️⃣ Testing project image links in database...');
    
    // Create a test session
    const sessionKey = `test_debug_${Date.now()}`;
    const { data: session, error: sessionError } = await supabase
      .from('conversation_sessions')
      .insert({
        session_key: sessionKey,
        title: 'Debug Image Test Session'
      })
      .select('id')
      .single();
    
    if (sessionError) {
      throw new Error(`Error creating test session: ${sessionError.message}`);
    }
    
    console.log(`Created test session with ID: ${session.id}`);
    
    // Create a test chat message
    const testMessage = `Information about the ${projectWithImage.title} project`;
    const { data: message, error: messageError } = await supabase
      .from('chat_history')
      .insert({
        session_id: session.id,
        role: 'assistant',
        content: testMessage,
        response: testMessage
      })
      .select('id')
      .single();
    
    if (messageError) {
      throw new Error(`Error creating test message: ${messageError.message}`);
    }
    
    console.log(`Created test message with ID: ${message.id}`);
    
    // Try to link the project and message directly
    const { data: linkData, error: linkError } = await supabase
      .from('chat_projects')
      .insert({
        message_id: message.id,
        project_id: projectWithImage.id,
        project_image: projectWithImage.image_url
      })
      .select()
      .single();
    
    if (linkError) {
      console.error(`Error linking project: ${linkError.message}`);
      
      // Try RPC as fallback
      console.log('Attempting to use save_chat_project RPC instead...');
      
      const { data: rpcResult, error: rpcError } = await supabase.rpc(
        'save_chat_project',
        {
          p_message_id: message.id,
          p_project_id: projectWithImage.id,
          p_project_image: projectWithImage.image_url
        }
      );
      
      if (rpcError) {
        console.error(`RPC error: ${rpcError.message}`);
        console.log('\n❌ Database link test failed. The save_chat_project function may not be working correctly.');
      } else {
        console.log(`RPC result: ${rpcResult}`);
        console.log('\n✅ Project linked to message using RPC function.');
      }
    } else {
      console.log(`Link created: ${JSON.stringify(linkData)}`);
      console.log('\n✅ Project successfully linked to message in database!');
    }
    
    // Verify if the link worked
    const { data: verification, error: verifyError } = await supabase
      .from('chat_projects')
      .select('project_id, project_image')
      .eq('message_id', message.id)
      .single();
    
    if (verifyError) {
      console.error(`Verification error: ${verifyError.message}`);
    } else {
      console.log(`Verification result: ${JSON.stringify(verification)}`);
      
      if (verification.project_image === projectWithImage.image_url) {
        console.log('✅ Image URL correctly stored in database!');
      } else {
        console.log('❌ Image URL not correctly stored in database.');
      }
    }
    
    // 3. Check if getSessionMessages retrieves the image
    console.log('\n3️⃣ Testing image retrieval in getSessionMessages...');
    
    // Direct query similar to what getSessionMessages does
    const { data: messagesWithProjects, error: retrieveError } = await supabase
      .from('chat_history')
      .select(`
        id, 
        role, 
        content, 
        user_prompt, 
        response,
        chat_projects!inner (
          project_id,
          project_image
        )
      `)
      .eq('session_id', session.id)
      .eq('chat_projects.message_id', message.id);
    
    if (retrieveError) {
      console.error(`Retrieval error: ${retrieveError.message}`);
    } else {
      console.log(`Retrieved ${messagesWithProjects.length} message(s) with project data:`);
      console.log(JSON.stringify(messagesWithProjects, null, 2));
      
      const hasImage = messagesWithProjects.length > 0 && 
                    messagesWithProjects[0].chat_projects && 
                    messagesWithProjects[0].chat_projects.length > 0 && 
                    messagesWithProjects[0].chat_projects[0].project_image;
      
      if (hasImage) {
        console.log('✅ Image URL is retrieved when querying messages!');
      } else {
        console.log('❌ Image URL not found in retrieved messages.');
      }
    }
    
    // 4. Check API route.ts file for correct image handling
    console.log('\n4️⃣ Checking API route for image handling...');
    
    const routeFilePath = path.join(rootDir, 'app/api/chat/route.ts');
    if (!fs.existsSync(routeFilePath)) {
      console.log(`❌ Could not find route.ts file at ${routeFilePath}`);
    } else {
      const routeFile = fs.readFileSync(routeFilePath, 'utf8');
      
      // Check for key features
      const hasGetProjectFirstImage = routeFile.includes('getProjectFirstImage');
      const hasFindMostRelevantProject = routeFile.includes('findMostRelevantProject');
      const hasProjectImage = routeFile.includes('project_image');
      const hasImgInstruction = routeFile.includes('<img src=');
      
      console.log(`- getProjectFirstImage function: ${hasGetProjectFirstImage ? '✅ Found' : '❌ Missing'}`);
      console.log(`- findMostRelevantProject function: ${hasFindMostRelevantProject ? '✅ Found' : '❌ Missing'}`);
      console.log(`- project_image in response: ${hasProjectImage ? '✅ Found' : '❌ Missing'}`);
      console.log(`- Image tag instructions: ${hasImgInstruction ? '✅ Found' : '❌ Missing'}`);
      
      // Check for save_chat_project usage
      const hasSaveChatProject = routeFile.includes('save_chat_project');
      console.log(`- save_chat_project usage: ${hasSaveChatProject ? '✅ Found' : '❌ Missing'}`);
      
      // Search for image-related system message
      const systemMessageMatch = routeFile.match(/systemMessageContent\s*=\s*`([\s\S]*?)`/);
      if (systemMessageMatch) {
        const systemMessage = systemMessageMatch[1];
        const hasImageInstructions = systemMessage.includes('DISPLAY PROJECT IMAGE') || 
                                  systemMessage.includes('<img');
        
        console.log(`- Image instructions in system message: ${hasImageInstructions ? '✅ Found' : '❌ Missing'}`);
        
        if (!hasImageInstructions) {
          console.log('\n❗ ISSUE FOUND: No image display instructions in system message');
          console.log('This is likely why images are not appearing in the chat responses.');
        }
      }
    }
    
    // 5. Check if AIChat.tsx properly renders HTML content
    console.log('\n5️⃣ Checking AIChat.tsx for image rendering...');
    
    const chatComponentPath = path.join(rootDir, 'components/AIChat.tsx');
    if (!fs.existsSync(chatComponentPath)) {
      console.log(`❌ Could not find AIChat.tsx at ${chatComponentPath}`);
    } else {
      const chatComponent = fs.readFileSync(chatComponentPath, 'utf8');
      
      // Check for image handling
      const hasProjectImage = chatComponent.includes('projectImage');
      const hasDangerouslySetInnerHTML = chatComponent.includes('dangerouslySetInnerHTML');
      
      console.log(`- projectImage property: ${hasProjectImage ? '✅ Found' : '❌ Missing'}`);
      console.log(`- dangerouslySetInnerHTML: ${hasDangerouslySetInnerHTML ? '✅ Found' : '❌ Missing'}`);
      
      if (hasProjectImage && hasDangerouslySetInnerHTML) {
        console.log('✅ AIChat.tsx appears to handle both projectImage and HTML content correctly');
      } else {
        console.log('❌ AIChat.tsx may not be properly configured to display images');
      }
    }
    
    // Final diagnosis
    console.log('\n📋 Final Diagnosis:');
    console.log('================================================================');
    
    if (!fs.existsSync(routeFilePath)) {
      console.log('❌ Could not check route.ts file - manual inspection needed');
    } else {
      const routeFile = fs.readFileSync(routeFilePath, 'utf8');
      const systemMessageMatch = routeFile.match(/systemMessageContent\s*=\s*`([\s\S]*?)`/);
      
      if (systemMessageMatch) {
        const systemMessage = systemMessageMatch[1];
        const hasImageInstructions = systemMessage.includes('DISPLAY PROJECT IMAGE') || 
                                  systemMessage.includes('<img');
        
        if (!hasImageInstructions) {
          console.log('🔍 Most likely issue: Missing image instructions in OpenAI system message');
          console.log('\nSolution:');
          console.log('1. Modify the systemMessageContent in route.ts to include:');
          console.log(`
DISPLAY PROJECT IMAGE:
7. For queries about specific projects, include an image at the beginning of your response.
8. Use the following image tag format in your response:
   <img src="\${projectImage}" alt="Project Image" class="project-image" />
9. ONLY use images that are from our database - NEVER generate or refer to external images.`);
        } else {
          console.log('🔍 The system appears correctly configured, but the image is still not showing.');
          console.log('\nTry these solutions:');
          console.log('1. Make the image instructions in the system message more prominent');
          console.log('2. Check that the OpenAI model is following instructions to include image tags');
          console.log('3. Verify the frontend component is correctly rendering HTML with image tags');
        }
      }
    }
    
    console.log('================================================================');
    
  } catch (error) {
    console.error('Diagnosis failed:', error);
  }
}

// Run the diagnostic
diagnoseProblem().catch(console.error); 