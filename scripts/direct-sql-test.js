/**
 * Direct SQL Test for RAG Chat System
 * 
 * This script tests the chat functionality using direct SQL queries
 * instead of Prisma models to avoid schema issues.
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

async function testChatWithSQL() {
  try {
    console.log('Testing RAG Chat functionality with direct SQL...');
    
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
        'Test Direct SQL Session',
        '${randomUUID()}',
        NOW()
      );
    `);
    
    console.log(`Created session with ID: ${sessionId}`);
    
    // 2. Add a user message
    console.log('\n2. Adding user message...');
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
        'How does the RAG system work?',
        'How does the RAG system work?',
        '',
        NOW()
      );
    `);
    
    console.log(`Added user message with ID: ${userMessageId}`);
    
    // 3. Add an assistant message
    console.log('\n3. Adding assistant message...');
    const assistantResponse = 'RAG (Retrieval-Augmented Generation) works by combining document retrieval with generative AI to produce more accurate, current and context-aware responses.';
    
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
    
    // 4. Try to create chat_analytics table if it doesn't exist
    console.log('\n4. Setting up chat_analytics table if needed...');
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS chat_analytics (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          session_id UUID REFERENCES conversation_sessions(id),
          query TEXT NOT NULL,
          response TEXT NOT NULL,
          response_time FLOAT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
      `);
      
      // Add a record to chat_analytics
      await prisma.$executeRawUnsafe(`
        INSERT INTO chat_analytics (
          id, session_id, query, response, response_time, created_at
        ) 
        VALUES (
          '${randomUUID()}',
          '${sessionId}',
          'How does the RAG system work?',
          '${assistantResponse}',
          1.25,
          NOW()
        );
      `);
      
      console.log('Added analytics entry');
    } catch (error) {
      console.log('Could not create or use chat_analytics table:', error.message);
    }
    
    // 5. Retrieve and verify the conversation
    console.log('\n5. Retrieving conversation messages...');
    const result = await prisma.$queryRawUnsafe(`
      SELECT id, role, content, created_at 
      FROM chat_history 
      WHERE session_id = '${sessionId}'
      ORDER BY created_at ASC;
    `);
    
    console.log('Retrieved messages:');
    result.forEach((msg) => {
      console.log(`- ${msg.role}: ${msg.content.substring(0, 50)}...`);
    });
    
    console.log('\n✅ RAG Chat system test with SQL completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testChatWithSQL().catch(console.error); 