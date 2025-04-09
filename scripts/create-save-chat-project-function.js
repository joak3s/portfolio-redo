/**
 * Create the save_chat_project function in Supabase
 * 
 * This script creates a Postgres function that links chat messages to projects 
 * and ensures project images are properly saved.
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

async function createSaveChatProjectFunction() {
  try {
    console.log('Creating save_chat_project database function...');
    
    // First ensure the chat_projects table exists
    console.log('\n1. Ensuring chat_projects table exists...');
    
    // Each SQL statement needs to be executed separately
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS chat_projects (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          message_id UUID NOT NULL REFERENCES chat_history(id),
          project_id UUID NOT NULL REFERENCES projects(id),
          project_image TEXT,
          relevance_score FLOAT DEFAULT 0.0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
      `);
      console.log('Created chat_projects table');
    } catch (error) {
      console.log('Table already exists or error:', error.message);
    }
    
    try {
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_chat_projects_message_id ON chat_projects(message_id);
      `);
      console.log('Created message_id index');
    } catch (error) {
      console.log('Index already exists or error:', error.message);
    }
    
    try {
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_chat_projects_project_id ON chat_projects(project_id);
      `);
      console.log('Created project_id index');
    } catch (error) {
      console.log('Index already exists or error:', error.message);
    }
    
    // Now create the function
    console.log('\n2. Creating save_chat_project function...');
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION save_chat_project(
        p_message_id UUID,
        p_project_id UUID,
        p_project_image TEXT DEFAULT NULL,
        p_relevance_score FLOAT DEFAULT 0.7
      ) RETURNS BOOLEAN
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        v_project_image TEXT;
      BEGIN
        -- If no project image provided, try to find one
        IF p_project_image IS NULL THEN
          SELECT url INTO v_project_image
          FROM project_images
          WHERE project_id = p_project_id
          ORDER BY order_index
          LIMIT 1;
        ELSE
          v_project_image := p_project_image;
        END IF;
        
        -- Insert the record with all data
        INSERT INTO chat_projects (
          message_id,
          project_id,
          project_image,
          relevance_score
        ) VALUES (
          p_message_id,
          p_project_id,
          v_project_image,
          p_relevance_score
        );
        
        RETURN TRUE;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE NOTICE 'Error in save_chat_project: %', SQLERRM;
          RETURN FALSE;
      END;
      $$;
    `);
    console.log('Created save_chat_project function');
    
    try {
      await prisma.$executeRawUnsafe(`
        COMMENT ON FUNCTION save_chat_project IS 'Links chat messages to projects and ensures project images are properly saved';
      `);
      console.log('Added function comment');
    } catch (error) {
      console.log('Comment not added or error:', error.message);
    }
    
    console.log('\n✅ save_chat_project function created successfully!');
    
  } catch (error) {
    console.error('Function creation failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
createSaveChatProjectFunction().catch(console.error); 