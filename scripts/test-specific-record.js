#!/usr/bin/env node

/**
 * Script to test fetching specific general_info records
 * Usage: node scripts/test-specific-record.js <search-term>
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(rootDir, '.env.local') });

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Search term - can be passed as command line argument
const searchTerm = process.argv[2] || 'javascript';

async function testSearch() {
  try {
    console.log(`Searching for general_info records containing: "${searchTerm}"`);
    
    // Search by content
    const { data: contentMatches, error: contentError } = await supabase
      .from('general_info')
      .select('*')
      .ilike('content', `%${searchTerm}%`);
    
    if (contentError) {
      console.error('Error searching content:', contentError);
    } else if (contentMatches && contentMatches.length > 0) {
      console.log(`\nFound ${contentMatches.length} records with content matching "${searchTerm}":`);
      contentMatches.forEach(record => {
        console.log(`\n- ${record.title} (${record.category || 'N/A'}):`);
        console.log(`  ID: ${record.id}`);
        console.log(`  Priority: ${record.priority || 'N/A'}`);
        
        // Show the content with the search term highlighted
        const content = record.content;
        const searchTermRegex = new RegExp(`(${searchTerm})`, 'gi');
        const highlightedContent = content.replace(searchTermRegex, '**$1**');
        console.log(`  Content: ${highlightedContent.substring(0, 150)}${highlightedContent.length > 150 ? '...' : ''}`);
      });
    } else {
      console.log(`No records found with content matching "${searchTerm}"`);
    }
    
    // Search by title
    const { data: titleMatches, error: titleError } = await supabase
      .from('general_info')
      .select('*')
      .ilike('title', `%${searchTerm}%`);
    
    if (titleError) {
      console.error('Error searching titles:', titleError);
    } else if (titleMatches && titleMatches.length > 0) {
      console.log(`\nFound ${titleMatches.length} records with title matching "${searchTerm}":`);
      titleMatches.forEach(record => {
        console.log(`\n- ${record.title} (${record.category || 'N/A'}):`);
        console.log(`  ID: ${record.id}`);
        console.log(`  Priority: ${record.priority || 'N/A'}`);
        console.log(`  Content: ${record.content.substring(0, 100)}${record.content.length > 100 ? '...' : ''}`);
      });
    } else {
      console.log(`No records found with title matching "${searchTerm}"`);
    }
    
    // For Skills category, show all records
    if (searchTerm.toLowerCase() === 'javascript' || searchTerm.toLowerCase() === 'skills') {
      const { data: skillsRecords, error: skillsError } = await supabase
        .from('general_info')
        .select('*')
        .eq('category', 'Skills');
      
      if (skillsError) {
        console.error('Error fetching skills records:', skillsError);
      } else if (skillsRecords && skillsRecords.length > 0) {
        console.log(`\nAll records in the Skills category (${skillsRecords.length}):`);
        skillsRecords.forEach(record => {
          console.log(`\n- ${record.title}:`);
          console.log(`  ID: ${record.id}`);
          console.log(`  Priority: ${record.priority || 'N/A'}`);
          console.log(`  Content: ${record.content.substring(0, 100)}${record.content.length > 100 ? '...' : ''}`);
        });
      } else {
        console.log('No records found in the Skills category');
      }
    }
  } catch (error) {
    console.error('Unhandled error:', error);
    process.exit(1);
  }
}

testSearch(); 