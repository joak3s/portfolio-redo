/**
 * Update the chat_projects table structure
 * 
 * This script adds missing columns to the chat_projects table
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function updateChatProjectsTable() {
  try {
    console.log('Updating chat_projects table structure...');
    
    // Inspect current structure
    console.log('\n1. Checking current table structure...');
    const tableInfo = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'chat_projects'
      ORDER BY ordinal_position;
    `);
    
    console.table(tableInfo);
    
    // Add missing columns
    console.log('\n2. Adding missing columns...');
    
    // Check if relevance_score column exists
    const hasRelevanceScore = tableInfo.some(col => col.column_name === 'relevance_score');
    if (!hasRelevanceScore) {
      try {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE chat_projects 
          ADD COLUMN relevance_score FLOAT DEFAULT 0.0;
        `);
        console.log('Added relevance_score column');
      } catch (error) {
        console.error('Error adding relevance_score column:', error.message);
      }
    } else {
      console.log('relevance_score column already exists');
    }
    
    // Check if created_at column exists
    const hasCreatedAt = tableInfo.some(col => col.column_name === 'created_at');
    if (!hasCreatedAt) {
      try {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE chat_projects 
          ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT now();
        `);
        console.log('Added created_at column');
      } catch (error) {
        console.error('Error adding created_at column:', error.message);
      }
    } else {
      console.log('created_at column already exists');
    }
    
    // Check for indexes
    console.log('\n3. Ensuring indexes exist...');
    
    try {
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_chat_projects_message_id ON chat_projects(message_id);
      `);
      console.log('Created/ensured message_id index');
    } catch (error) {
      console.error('Error creating message_id index:', error.message);
    }
    
    try {
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_chat_projects_project_id ON chat_projects(project_id);
      `);
      console.log('Created/ensured project_id index');
    } catch (error) {
      console.error('Error creating project_id index:', error.message);
    }
    
    // Check final structure to confirm changes
    console.log('\n4. Verifying updated table structure...');
    const updatedTableInfo = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'chat_projects'
      ORDER BY ordinal_position;
    `);
    
    console.table(updatedTableInfo);
    
    console.log('\n✅ chat_projects table updated successfully!');
    
  } catch (error) {
    console.error('Table update failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
updateChatProjectsTable().catch(console.error); 