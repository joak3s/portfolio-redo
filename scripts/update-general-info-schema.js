#!/usr/bin/env node

/**
 * Script to update the general_info table schema using Prisma
 */

import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Initialize environment
config();

// Initialize Prisma
const prisma = new PrismaClient();

async function updateGeneralInfoSchema() {
  try {
    console.log('Starting general_info schema update...');
    
    // Check the current schema to see what columns we need to add
    console.log('Checking current table schema...');
    const tableInfo = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'general_info'
      ORDER BY ordinal_position;
    `);
    
    console.log('Current general_info columns:');
    tableInfo.forEach(col => {
      console.log(`- ${col.column_name} (${col.data_type}, ${col.is_nullable === 'YES' ? 'nullable' : 'not nullable'})`);
    });
    
    // Define the columns we need to add
    const columnsToAdd = [
      { name: 'updated_at', type: 'TIMESTAMP WITH TIME ZONE', default: 'now()' },
      { name: 'source', type: 'TEXT', default: null },
      { name: 'parent_id', type: 'UUID', default: null },
      { name: 'embedding_id', type: 'UUID', default: null },
      { name: 'relevance', type: 'FLOAT', default: '0.5' },
      { name: 'is_chunked', type: 'BOOLEAN', default: 'false' }
    ];
    
    // Add any missing columns
    for (const column of columnsToAdd) {
      const columnExists = tableInfo.some(col => col.column_name === column.name);
      
      if (!columnExists) {
        console.log(`Adding column ${column.name}...`);
        
        let defaultClause = '';
        if (column.default !== null) {
          defaultClause = ` DEFAULT ${column.default}`;
        }
        
        try {
          await prisma.$executeRawUnsafe(`
            ALTER TABLE public.general_info 
            ADD COLUMN ${column.name} ${column.type}${defaultClause};
          `);
          console.log(`- Column ${column.name} added successfully`);
        } catch (error) {
          if (error.message.includes('already exists')) {
            console.log(`- Column ${column.name} already exists, skipping`);
          } else {
            throw error;
          }
        }
      } else {
        console.log(`Column ${column.name} already exists, skipping`);
      }
    }
    
    // Add indexes if they don't exist
    console.log('\nAdding indexes...');
    
    try {
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_general_info_category ON public.general_info (category);
      `);
      console.log('- Category index added or already exists');
    } catch (error) {
      console.error('Error adding category index:', error.message);
    }
    
    try {
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_general_info_parent_id ON public.general_info (parent_id);
      `);
      console.log('- Parent ID index added or already exists');
    } catch (error) {
      console.error('Error adding parent_id index:', error.message);
    }
    
    // Check the current schema again to verify changes
    console.log('\nVerifying updated schema...');
    const updatedTableInfo = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'general_info'
      ORDER BY ordinal_position;
    `);
    
    console.log('Updated general_info columns:');
    updatedTableInfo.forEach(col => {
      console.log(`- ${col.column_name} (${col.data_type}, ${col.is_nullable === 'YES' ? 'nullable' : 'not nullable'})`);
    });
    
    // Verify indexes
    console.log('\nVerifying indexes...');
    const indexes = await prisma.$queryRawUnsafe(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'general_info' AND schemaname = 'public';
    `);
    
    console.log('Current indexes:');
    indexes.forEach(idx => {
      console.log(`- ${idx.indexname}: ${idx.indexdef}`);
    });
    
    console.log('\nSchema update completed successfully!');
    
  } catch (error) {
    console.error('Error updating schema:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
updateGeneralInfoSchema()
  .catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
  }); 