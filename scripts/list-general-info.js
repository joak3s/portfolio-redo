#!/usr/bin/env node

/**
 * Script to list the current contents of the general_info table
 */

import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Initialize environment
config();

// Initialize Prisma
const prisma = new PrismaClient();

async function listGeneralInfo() {
  try {
    console.log('Fetching general_info records...');
    
    // Get all general_info records
    const records = await prisma.general_info.findMany({
      orderBy: {
        created_at: 'desc'
      }
    });
    
    console.log(`Found ${records.length} records in general_info table.\n`);
    
    // Display a summary of all records
    console.log('=== GENERAL INFO SUMMARY ===');
    console.log('ID\t\t\t\t\tCategory\t\tTitle');
    console.log('-'.repeat(100));
    
    records.forEach(record => {
      console.log(`${record.id}\t${record.category || 'N/A'}\t\t${record.title.substring(0, 30)}${record.title.length > 30 ? '...' : ''}`);
    });
    
    console.log('\n=== CATEGORY DISTRIBUTION ===');
    // Count records by category
    const categories = {};
    records.forEach(record => {
      const category = record.category || 'uncategorized';
      categories[category] = (categories[category] || 0) + 1;
    });
    
    // Display category distribution
    Object.entries(categories).forEach(([category, count]) => {
      console.log(`${category}: ${count} records`);
    });
    
    // Display a sample record in detail
    if (records.length > 0) {
      console.log('\n=== SAMPLE RECORD DETAILS ===');
      const sample = records[0];
      
      console.log(`ID: ${sample.id}`);
      console.log(`Title: ${sample.title}`);
      console.log(`Category: ${sample.category || 'N/A'}`);
      console.log(`Content: ${sample.content.substring(0, 150)}${sample.content.length > 150 ? '...' : ''}`);
      console.log(`Keywords: ${sample.keywords ? sample.keywords.join(', ') : 'N/A'}`);
      console.log(`Priority: ${sample.priority || 'N/A'}`);
      console.log(`Created At: ${sample.created_at}`);
      console.log(`Updated At: ${sample.updated_at || 'N/A'}`);
      console.log(`Source: ${sample.source || 'N/A'}`);
      console.log(`Parent ID: ${sample.parent_id || 'N/A'}`);
      console.log(`Embedding ID: ${sample.embedding_id || 'N/A'}`);
      console.log(`Relevance: ${sample.relevance || 'N/A'}`);
      console.log(`Is Chunked: ${sample.is_chunked !== null ? sample.is_chunked : 'N/A'}`);
    }
    
  } catch (error) {
    console.error('Error listing general_info records:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
listGeneralInfo()
  .catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
  }); 