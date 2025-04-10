#!/usr/bin/env node

/**
 * Script to update a specific general_info record
 * Usage: node scripts/update-general-info.js <record-id>
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

// Record to update - can be passed as command line argument
const recordId = process.argv[2] || 'fce3c4fb-b930-4fb2-a52b-8dae32c3f876';

// Update data
const updateData = {
  title: 'Javascript Proficiency',
  content: 'Jordan is skilled in modern JavaScript development, leveraging frameworks like React and Next.js. He leverages Javascript and TypeScript to enhance websites and apps.',
  priority: 'medium',
  updated_at: new Date().toISOString()
};

async function updateGeneralInfo() {
  try {
    console.log(`Updating general_info record with ID: ${recordId}`);
    
    // First, get the current record to confirm it exists
    const { data: currentRecord, error: fetchError } = await supabase
      .from('general_info')
      .select('*')
      .eq('id', recordId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching record:', fetchError);
      process.exit(1);
    }
    
    if (!currentRecord) {
      console.error(`Record with ID ${recordId} not found`);
      process.exit(1);
    }
    
    console.log('Current record:');
    console.log(`Title: ${currentRecord.title}`);
    console.log(`Content: ${currentRecord.content.substring(0, 50)}${currentRecord.content.length > 50 ? '...' : ''}`);
    console.log(`Category: ${currentRecord.category || 'N/A'}`);
    console.log(`Priority: ${currentRecord.priority || 'N/A'}`);
    console.log('\nUpdating record...');
    
    // Update the record
    const { data, error } = await supabase
      .from('general_info')
      .update(updateData)
      .eq('id', recordId);
    
    if (error) {
      console.error('Error updating record:', error);
      process.exit(1);
    }
    
    console.log('Record updated successfully!');
    
    // Fetch the updated record to confirm changes
    const { data: updatedRecord, error: fetchUpdatedError } = await supabase
      .from('general_info')
      .select('*')
      .eq('id', recordId)
      .single();
    
    if (fetchUpdatedError) {
      console.error('Error fetching updated record:', fetchUpdatedError);
    } else {
      console.log('\nUpdated record:');
      console.log(`Title: ${updatedRecord.title}`);
      console.log(`Content: ${updatedRecord.content.substring(0, 50)}${updatedRecord.content.length > 50 ? '...' : ''}`);
      console.log(`Category: ${updatedRecord.category || 'N/A'}`);
      console.log(`Priority: ${updatedRecord.priority || 'N/A'}`);
      console.log(`Updated At: ${new Date(updatedRecord.updated_at).toLocaleString()}`);
    }
  } catch (error) {
    console.error('Unhandled error:', error);
    process.exit(1);
  }
}

updateGeneralInfo(); 