import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();
dotenv.config({ path: '.env.local' });

// Print environment variables status (without exposing values)
console.log('Environment variables status:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Available ✓' : 'Missing ✗');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Available ✓' : 'Missing ✗');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Check your .env files.');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function deployHybridSearchFunction() {
  try {
    // Read the SQL file - updated to use the new file with summary field
    const sqlFilePath = path.join(process.cwd(), 'scripts', 'supabase', 'hybrid-search-summary.sql');
    const sqlContent = readFileSync(sqlFilePath, 'utf8');
    
    console.log('🚨 Cannot directly deploy hybrid_search function through the API');
    console.log('Please follow these steps to deploy it manually:');
    console.log('\n1. Go to the Supabase dashboard: https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Go to the SQL Editor');
    console.log('4. Create a new query');
    console.log('5. Copy and paste the SQL below:');
    console.log('\n------- SQL CONTENT TO COPY -------');
    console.log(sqlContent);
    console.log('------- END SQL CONTENT -------\n');
    console.log('6. Run the query\n');
    
    console.log('Additionally, you can test the search function by running:');
    console.log('node scripts/supabase/test-hybrid-search.js "Your test query here"');
    
    return true;
  } catch (error) {
    console.error('Error reading SQL file:', error);
    return false;
  }
}

// Run the function
deployHybridSearchFunction()
  .then(success => {
    if (success) {
      console.log('Operation completed. Please follow the instructions above.');
    } else {
      console.error('Operation failed. Check the errors above.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Error during operation:', error);
    process.exit(1);
  }); 