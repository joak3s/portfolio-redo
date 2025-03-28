#!/usr/bin/env node
const fs = require('fs');
const https = require('https');
const path = require('path');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

// Get Supabase credentials from env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in environment variables');
  process.exit(1);
}

// Read the SQL file
const sqlFilePath = path.join(__dirname, 'journey_milestones_setup.sql');
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

// Parse the URL to get the hostname and path
const url = new URL(supabaseUrl);
const hostname = url.hostname;

// Setup the request options
const options = {
  hostname: hostname,
  path: '/rest/v1/rpc/exec_sql',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${supabaseServiceKey}`,
    'apikey': supabaseServiceKey
  }
};

console.log(`Connecting to Supabase at ${hostname}...`);

// Create the request
const req = https.request(options, (res) => {
  let data = '';

  // A chunk of data has been received
  res.on('data', (chunk) => {
    data += chunk;
  });

  // The whole response has been received
  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('Migration executed successfully!');
      console.log('Response:', data);
    } else {
      console.error(`Error: Received status code ${res.statusCode}`);
      console.error('Response:', data);
      console.log('\nIf the migration failed, try running it manually:');
      console.log('1. Go to https://supabase.com/dashboard/project/' + url.pathname.split('/').pop() + '/sql/new');
      console.log('2. Paste the SQL from journey_milestones_setup.sql');
      console.log('3. Click "Run" to execute the SQL');
    }
  });
});

// Handle request errors
req.on('error', (error) => {
  console.error('Error making request:', error.message);
  console.log('\nPlease run the migration manually:');
  console.log('1. Go to https://supabase.com/dashboard/project/' + url.pathname.split('/').pop() + '/sql/new');
  console.log('2. Paste the SQL from journey_milestones_setup.sql');
  console.log('3. Click "Run" to execute the SQL');
});

// Send the SQL payload
const payload = JSON.stringify({
  query: sqlContent
});

req.write(payload);
req.end();

console.log('Sending migration to Supabase...'); 