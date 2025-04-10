#!/usr/bin/env node

/**
 * Script to optimize the general_info table by splitting longer content
 * into more granular, single-sentence records.
 * 
 * This helps provide more relevant, targeted context to AI responses.
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(rootDir, '.env.local') });

// Verify environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  process.exit(1);
}

console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('Starting general_info table optimization...');
  
  // Get current records from general_info table
  const { data: currentRecords, error } = await supabase
    .from('general_info')
    .select('*');
  
  if (error) {
    console.error('Error fetching current records:', error);
    process.exit(1);
  }
  
  console.log(`Found ${currentRecords.length} existing records`);
  
  // Array to store new granular records
  const newRecords = [];
  
  // Process each record, splitting content into sentences
  for (const record of currentRecords) {
    // Split content into sentences (basic split on periods followed by space)
    // This is a simple approach; consider using a more robust NLP library for production
    const sentences = record.content
      .split(/\.(?=\s|$)/)
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map(s => s.endsWith('.') ? s : `${s}.`);
    
    if (sentences.length === 0) {
      // Keep original if no sentences found
      newRecords.push({
        title: record.title,
        category: record.category,
        content: record.content,
        keywords: record.keywords || [],
        priority: record.priority,
        source: record.source || 'original',
        parent_id: null,
        is_chunked: false,
        relevance: record.relevance || 0.5
      });
      continue;
    }
    
    // Create a new record for each sentence
    for (const sentence of sentences) {
      if (sentence.length < 10) continue; // Skip very short sentences
      
      newRecords.push({
        title: `${record.title} - Detail`,
        category: record.category,
        content: sentence,
        keywords: record.keywords || [],
        priority: record.priority,
        source: record.source || 'original',
        parent_id: record.id, // Track relationship to original
        is_chunked: true,
        relevance: record.relevance || 0.5
      });
    }
  }
  
  console.log(`Generated ${newRecords.length} granular records`);
  
  // Confirm with user before proceeding
  console.log('\nWARNING: This will replace all records in the general_info table.');
  console.log('Press Ctrl+C to cancel or wait 5 seconds to continue...');
  
  // Wait for 5 seconds to allow cancellation
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Backup current records (optional)
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const { error: backupError } = await supabase
    .from(`general_info_backup_${timestamp}`)
    .insert(currentRecords);
  
  if (backupError) {
    console.warn('Error creating backup:', backupError);
    console.log('Proceeding without backup...');
  } else {
    console.log(`Backup created as general_info_backup_${timestamp}`);
  }
  
  // Delete current records
  const { error: deleteError } = await supabase
    .from('general_info')
    .delete()
    .filter('id', 'neq', '00000000-0000-0000-0000-000000000000'); // Delete all records with a valid comparison
  
  if (deleteError) {
    console.error('Error deleting current records:', deleteError);
    process.exit(1);
  }
  
  // Insert new granular records
  const batchSize = 100;
  for (let i = 0; i < newRecords.length; i += batchSize) {
    const batch = newRecords.slice(i, i + batchSize);
    const { error: insertError } = await supabase
      .from('general_info')
      .insert(batch);
    
    if (insertError) {
      console.error(`Error inserting batch ${i/batchSize + 1}:`, insertError);
      process.exit(1);
    }
    
    console.log(`Inserted batch ${i/batchSize + 1}/${Math.ceil(newRecords.length/batchSize)}`);
  }
  
  console.log('\nOptimization complete!');
  console.log(`Replaced ${currentRecords.length} records with ${newRecords.length} granular records`);
  console.log('\nNext step: Run the generate-embeddings.js script to create embeddings for all records.');
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
}); 