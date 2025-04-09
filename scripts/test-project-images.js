/**
 * Test script for the RAG Chat system with project images
 * 
 * This script tests linking projects to chat messages
 * and ensures images are correctly displayed
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function testChatProjectImages() {
  try {
    console.log('Testing RAG Chat with project images...');
    
    // Generate UUIDs
    const sessionId = randomUUID();
    const userMessageId = randomUUID();
    const assistantMessageId = randomUUID();
    
    // 1. Create a test conversation session
    console.log('\n1. Creating test conversation session...');
    await prisma.$executeRawUnsafe(`
      INSERT INTO conversation_sessions (id, title, session_key, created_at)
      VALUES (
        '${sessionId}',
        'Test Project Images Session',
        '${randomUUID()}',
        NOW()
      );
    `);
    
    console.log(`Created session with ID: ${sessionId}`);
    
    // 2. Add a user message asking about a project
    console.log('\n2. Adding user message about projects...');
    await prisma.$executeRawUnsafe(`
      INSERT INTO chat_history (
        id, 
        session_id, 
        role, 
        content, 
        user_prompt, 
        response,
        created_at
      )
      VALUES (
        '${userMessageId}',
        '${sessionId}',
        'user',
        'Tell me about your portfolio projects',
        'Tell me about your portfolio projects',
        '',
        NOW()
      );
    `);
    
    console.log(`Added user message with ID: ${userMessageId}`);
    
    // 3. Add an assistant message that should reference a project
    console.log('\n3. Adding assistant message with project reference...');
    const assistantResponse = 'I have worked on several projects including a Portfolio Website that showcases my design and development skills.';
    
    await prisma.$executeRawUnsafe(`
      INSERT INTO chat_history (
        id, 
        session_id, 
        role, 
        content, 
        user_prompt, 
        response,
        created_at
      )
      VALUES (
        '${assistantMessageId}',
        '${sessionId}',
        'assistant',
        '${assistantResponse}',
        '',
        '${assistantResponse}',
        NOW()
      );
    `);
    
    console.log(`Added assistant message with ID: ${assistantMessageId}`);
    
    // 4. Find a project to link to the message
    console.log('\n4. Finding a project to link...');
    const projectResult = await prisma.$queryRawUnsafe(`
      SELECT id, title, slug FROM projects LIMIT 1;
    `);
    
    if (!projectResult || projectResult.length === 0) {
      console.log('No projects found in database. Creating a test project...');
      
      const projectId = randomUUID();
      await prisma.$executeRawUnsafe(`
        INSERT INTO projects (id, title, slug, description, status)
        VALUES (
          '${projectId}',
          'Portfolio Website',
          'portfolio-website',
          'A showcase of my design and development skills',
          'published'
        );
      `);
      
      console.log(`Created test project with ID: ${projectId}`);
      projectResult.push({ id: projectId, title: 'Portfolio Website', slug: 'portfolio-website' });
    }
    
    const project = projectResult[0];
    console.log(`Using project: ${project.title} (${project.id})`);
    
    // 5. Find or create a project image
    console.log('\n5. Finding or creating a project image...');
    const imageResult = await prisma.$queryRawUnsafe(`
      SELECT id, project_id, url FROM project_images 
      WHERE project_id = '${project.id}'
      LIMIT 1;
    `);
    
    let projectImage;
    if (!imageResult || imageResult.length === 0) {
      console.log('No images found for this project. Creating a test image...');
      
      const imageId = randomUUID();
      const imageUrl = 'https://via.placeholder.com/800x600?text=Portfolio+Project';
      
      await prisma.$executeRawUnsafe(`
        INSERT INTO project_images (id, project_id, url, alt_text, order_index)
        VALUES (
          '${imageId}',
          '${project.id}',
          '${imageUrl}',
          'Portfolio Project Screenshot',
          0
        );
      `);
      
      console.log(`Created test image with ID: ${imageId}`);
      projectImage = { id: imageId, project_id: project.id, url: imageUrl };
    } else {
      projectImage = imageResult[0];
    }
    
    // 6. Link the chat message to the project with image
    console.log('\n6. Linking chat message to project with image...');
    
    // Check if chat_projects table exists
    try {
      await prisma.$executeRawUnsafe(`
        SELECT * FROM chat_projects LIMIT 1;
      `);
    } catch (error) {
      // Table doesn't exist, create it
      console.log('Creating chat_projects table...');
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS chat_projects (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          message_id UUID NOT NULL REFERENCES chat_history(id),
          project_id UUID NOT NULL REFERENCES projects(id),
          project_image TEXT,
          relevance_score FLOAT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        
        CREATE INDEX IF NOT EXISTS idx_chat_projects_message_id ON chat_projects(message_id);
        CREATE INDEX IF NOT EXISTS idx_chat_projects_project_id ON chat_projects(project_id);
      `);
    }
    
    const projectLinkId = randomUUID();
    await prisma.$executeRawUnsafe(`
      INSERT INTO chat_projects (
        id, message_id, project_id, project_image, relevance_score
      )
      VALUES (
        '${projectLinkId}',
        '${assistantMessageId}',
        '${project.id}',
        '${projectImage.url}',
        0.95
      );
    `);
    
    console.log(`Linked chat message to project with link ID: ${projectLinkId}`);
    
    // 7. Verify the chat message has project image attached
    console.log('\n7. Verifying project image in chat message...');
    const verifyResult = await prisma.$queryRawUnsafe(`
      SELECT 
        ch.id as message_id, 
        ch.content, 
        cp.project_id,
        cp.project_image
      FROM 
        chat_history ch
      LEFT JOIN 
        chat_projects cp ON ch.id = cp.message_id
      WHERE 
        ch.id = '${assistantMessageId}';
    `);
    
    console.log('Chat message with project details:');
    console.log(verifyResult[0]);
    
    if (verifyResult[0].project_image) {
      console.log('\n✅ Project image successfully linked to chat message!');
    } else {
      console.log('\n❌ Project image not linked to chat message.');
    }
    
    console.log('\nTest completed. Now verify in the AI Chat interface that project images are displayed correctly.');
    
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testChatProjectImages().catch(console.error); 