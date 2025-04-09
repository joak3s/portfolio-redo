/**
 * Database Schema Inspection Script
 * 
 * This script inspects the database schema for the chat tables
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

async function inspectSchema() {
  try {
    console.log('Inspecting database schema...');
    
    // Check chat_history table columns
    console.log('\nChecking chat_history table columns:');
    const chatHistoryInfo = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'chat_history'
      ORDER BY ordinal_position;
    `);
    
    console.table(chatHistoryInfo);
    
    // Check conversation_sessions table columns
    console.log('\nChecking conversation_sessions table columns:');
    const sessionsInfo = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'conversation_sessions'
      ORDER BY ordinal_position;
    `);
    
    console.table(sessionsInfo);
    
    // Check foreign key constraints
    console.log('\nChecking foreign key constraints:');
    const foreignKeys = await prisma.$queryRawUnsafe(`
      SELECT
        tc.table_schema, 
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND (tc.table_name = 'chat_history' OR ccu.table_name = 'chat_history')
      ORDER BY tc.table_name;
    `);
    
    console.table(foreignKeys);
    
    console.log('\n✅ Schema inspection completed!');
    
  } catch (error) {
    console.error('Inspection failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the inspection
inspectSchema().catch(console.error); 