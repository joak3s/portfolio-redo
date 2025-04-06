import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import https from 'https';
import http from 'http';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Environment variables:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'Missing');
console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'Available ✓' : 'Missing');

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// Test URL connectivity
async function testUrlConnectivity(url) {
  return new Promise((resolve) => {
    console.log(`Testing connectivity to: ${url}`);
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.get(url, (res) => {
      console.log(`Response status code: ${res.statusCode}`);
      resolve(true);
    });
    
    req.on('error', (error) => {
      console.error(`Error connecting to ${url}:`, error.message);
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      console.error(`Connection to ${url} timed out`);
      req.destroy();
      resolve(false);
    });
  });
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test connection
async function testConnection() {
  try {
    // First test basic connectivity to the Supabase URL
    await testUrlConnectivity(supabaseUrl);
    
    console.log('\nTesting Supabase connection...');
    const { data, error } = await supabase
      .from('projects')
      .select('count(*)', { count: 'exact', head: true });
    
    if (error) {
      console.error('Connection test failed with error:', error);
      
      // Additional diagnostic info
      if (error.code === 'ENOTFOUND') {
        console.error('DNS resolution failed. Check if the URL is correct and your internet connection is working.');
      } else if (error.code === 'ECONNREFUSED') {
        console.error('Connection refused. The server might be down or the port might be incorrect.');
      } else if (error.message?.includes('fetch failed')) {
        console.error('Fetch failed. This might be a network connectivity issue or CORS problem.');
      }
      
      return;
    }
    
    console.log('Connection successful!', data);
    
    // Try a more detailed query
    console.log('\nTesting a basic projects query...');
    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select('id, name')
      .limit(1);
      
    if (projectsError) {
      console.error('Projects query failed:', projectsError);
    } else {
      console.log('Projects query successful:', projectsData);
    }
  } catch (error) {
    console.error('Connection test failed with exception:', error);
  }
}

testConnection(); 