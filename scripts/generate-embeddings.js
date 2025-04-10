#!/usr/bin/env node

/**
 * Script to generate embeddings for general_info records
 * This script retrieves all general_info records, generates embeddings,
 * and stores them in the embeddings table with appropriate metadata.
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';

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

if (!process.env.OPENAI_API_KEY) {
  console.error('Missing OPENAI_API_KEY environment variable');
  process.exit(1);
}

// Constants
const EMBEDDING_MODEL = 'text-embedding-3-small';
const BATCH_SIZE = 10; // Number of records to process in a batch

// Initialize clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate embeddings with OpenAI API
async function generateEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
      dimensions: 1536
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error(`Error generating embedding: ${error.message}`);
    throw error;
  }
}

// Get all general_info records that need embeddings
async function getGeneralInfoRecords() {
  const { data, error } = await supabase
    .from('general_info')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching general_info records:', error);
    throw error;
  }
  
  return data;
}

// Store embedding in the embeddings table
async function storeEmbedding(recordId, content, embedding) {
  try {
    // Create embedding record
    const { data, error } = await supabase
      .from('embeddings')
      .insert({
        content_id: recordId,
        content_type: 'general_info',
        embedding_model: EMBEDDING_MODEL,
        embedding,
        chunk_index: 0,
        chunk_text: content,
        chunk_metadata: { 
          source: 'general_info',
          timestamp: new Date().toISOString()
        }
      })
      .select('id')
      .single();
      
    if (error) {
      console.error(`Error storing embedding for ${recordId}:`, error);
      return null;
    }
    
    // Update general_info record with the embedding_id
    const { error: updateError } = await supabase
      .from('general_info')
      .update({
        embedding_id: data.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', recordId);
      
    if (updateError) {
      console.error(`Error updating general_info ${recordId} with embedding_id:`, updateError);
    }
    
    return data.id;
  } catch (error) {
    console.error(`Error in storeEmbedding:`, error);
    return null;
  }
}

// Process records in batches
async function processInBatches(records) {
  console.log(`Processing ${records.length} records in batches of ${BATCH_SIZE}`);
  
  const results = {
    success: 0,
    failed: 0,
    skipped: 0
  };
  
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(records.length/BATCH_SIZE)}`);
    
    await Promise.all(batch.map(async (record) => {
      try {
        // Skip if record already has an embedding_id and it hasn't been updated
        if (record.embedding_id) {
          console.log(`Record ${record.id} already has embedding, skipping`);
          results.skipped++;
          return;
        }
        
        // Prepare content for embedding (title + content)
        const contentToEmbed = `${record.title}: ${record.content}`;
        
        // Generate embedding
        const embedding = await generateEmbedding(contentToEmbed);
        
        // Store embedding
        const embeddingId = await storeEmbedding(record.id, contentToEmbed, embedding);
        
        if (embeddingId) {
          console.log(`Successfully processed record ${record.id}`);
          results.success++;
        } else {
          console.error(`Failed to store embedding for record ${record.id}`);
          results.failed++;
        }
      } catch (error) {
        console.error(`Error processing record ${record.id}:`, error);
        results.failed++;
      }
    }));
    
    // Wait a bit between batches to avoid rate limiting
    if (i + BATCH_SIZE < records.length) {
      console.log('Waiting 2 seconds before next batch...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  return results;
}

// Main function
async function main() {
  try {
    console.log('Starting embedding generation for general_info records');
    
    // Get all general_info records
    const records = await getGeneralInfoRecords();
    console.log(`Found ${records.length} general_info records`);
    
    // Process records
    const results = await processInBatches(records);
    
    // Log summary
    console.log('\nEmbedding generation complete!');
    console.log(`Total records: ${records.length}`);
    console.log(`Successfully processed: ${results.success}`);
    console.log(`Skipped (already had embeddings): ${results.skipped}`);
    console.log(`Failed: ${results.failed}`);
    
  } catch (error) {
    console.error('Error in main process:', error);
    process.exit(1);
  }
}

// Execute main function
main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
}); 