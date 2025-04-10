#!/usr/bin/env node

/**
 * Script to apply the general_info table migration manually
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  try {
    console.log('Starting migration process...');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '../supabase/migrations/general_info_update.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    // Split into separate statements (simple split on ';')
    const statements = migrationSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      // Skip comments-only statements
      if (stmt.startsWith('--')) {
        console.log(`Skipping comment-only statement`);
        continue;
      }
      
      // Execute the statement
      const { error } = await supabase.rpc('exec_sql', { sql: stmt });
      
      if (error) {
        console.error(`Error executing statement ${i + 1}:`, error);
        
        // If the error is about the exec_sql function not existing, we need to create it
        if (error.message && error.message.includes('function exec_sql() does not exist')) {
          console.log('Creating exec_sql function...');
          
          // Create the exec_sql function (requires admin privileges)
          const createFunctionSql = `
          CREATE OR REPLACE FUNCTION exec_sql(sql text) RETURNS void AS $$
          BEGIN
            EXECUTE sql;
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;
          `;
          
          // Execute directly using the raw REST API
          const { error: functionError } = await supabase.rpc('exec_sql', { 
            sql: createFunctionSql 
          });
          
          if (functionError) {
            console.error('Could not create exec_sql function:', functionError);
            throw new Error('Migration cannot continue without exec_sql function');
          }
          
          // Retry the original statement
          console.log('Retrying statement...');
          const { error: retryError } = await supabase.rpc('exec_sql', { sql: stmt });
          
          if (retryError) {
            console.error(`Error on retry:`, retryError);
            throw retryError;
          }
        } else {
          // For other errors, check if it's just saying the column already exists
          const alreadyExistsError = error.message && 
            (error.message.includes('already exists') || 
             error.message.includes('duplicate'));
          
          if (alreadyExistsError) {
            console.log('Column or index already exists, continuing...');
          } else {
            // For other errors, stop execution
            throw error;
          }
        }
      } else {
        console.log(`Statement ${i + 1} executed successfully`);
      }
    }
    
    console.log('\nMigration completed successfully!');
    
    // Verify the new columns exist
    console.log('\nVerifying new columns...');
    const { data, error: verifyError } = await supabase
      .from('general_info')
      .select('updated_at, source, parent_id, embedding_id, relevance, is_chunked')
      .limit(1);
    
    if (verifyError) {
      console.error('Error verifying new columns:', verifyError);
    } else {
      console.log('New columns verified successfully:', Object.keys(data[0] || {}).join(', '));
    }
    
  } catch (error) {
    console.error('Error applying migration:', error);
    process.exit(1);
  }
}

// Run the migration
applyMigration().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
}); 