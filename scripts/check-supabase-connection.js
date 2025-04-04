#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env files
const loadEnv = () => {
  // Try loading from different env files in order of priority
  const envFiles = ['.env.local', '.env.development.local', '.env.development', '.env'];
  
  for (const file of envFiles) {
    const filePath = path.join(path.resolve(__dirname, '..'), file);
    if (fs.existsSync(filePath)) {
      console.log(`Loading environment from ${file}`);
      dotenv.config({ path: filePath });
      return true;
    }
  }
  
  console.warn('No .env file found');
  return false;
};

loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Error: Required Supabase environment variables are missing.');
  console.error(' - NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗ missing');
  console.error(' - NEXT_PUBLIC_SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✓' : '✗ missing');
  console.error(' - SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_KEY ? '✓' : '✗ missing (only needed for admin operations)');
  process.exit(1);
}

// Create clients
console.log(`\nTesting connection to Supabase at ${SUPABASE_URL}`);
const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseAdmin = SUPABASE_SERVICE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY) : null;

async function testConnection() {
  console.log('\n1. Testing public connection:');
  try {
    const { data, error } = await supabaseAnon.from('projects').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error(`  ❌ Error connecting: ${error.message}`);
      return false;
    }
    
    console.log('  ✅ Successfully connected to Supabase database');
    return true;
  } catch (error) {
    console.error(`  ❌ Connection error: ${error.message}`);
    return false;
  }
}

async function testAdminAccess() {
  if (!supabaseAdmin) {
    console.log('\n2. Skipping admin access test (no service role key)');
    return false;
  }
  
  console.log('\n2. Testing admin access:');
  try {
    // Attempt to list users as a privileged operation
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
      console.error(`  ❌ Admin access error: ${error.message}`);
      return false;
    }
    
    console.log(`  ✅ Admin access successful! Found ${data.users.length} users`);
    // Show first few users
    if (data.users.length > 0) {
      console.log('  👤 Sample users:');
      data.users.slice(0, 3).forEach(user => {
        console.log(`    - ${user.email || user.phone} (${user.id.slice(0, 8)}...)`);
      });
    }
    
    return true;
  } catch (error) {
    console.error(`  ❌ Admin access error: ${error.message}`);
    return false;
  }
}

async function testAuth(email, password) {
  if (!email || !password) {
    console.log('\n3. Skipping auth test (no credentials provided)');
    console.log('   To test auth, run: node scripts/check-supabase-connection.js email@example.com password');
    return null;
  }
  
  console.log(`\n3. Testing authentication for ${email}:`);
  try {
    const { data, error } = await supabaseAnon.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error(`  ❌ Authentication failed: ${error.message}`);
      return false;
    }
    
    console.log('  ✅ Authentication successful!');
    console.log(`  🔑 User ID: ${data.user.id}`);
    console.log(`  📧 Email: ${data.user.email}`);
    console.log(`  ⏱️ Session expires: ${new Date(data.session.expires_at * 1000).toLocaleString()}`);
    
    return true;
  } catch (error) {
    console.error(`  ❌ Authentication error: ${error.message}`);
    return false;
  }
}

async function checkNetworkConnectivity() {
  console.log('\n4. Checking network connectivity:');

  // Test DNS resolution
  try {
    console.log(`  🔍 Testing DNS resolution for ${new URL(SUPABASE_URL).hostname}`);
    // You need to have 'dns' module
    const dns = await import('dns');
    const { hostname } = new URL(SUPABASE_URL);
    
    dns.promises.lookup(hostname)
      .then(result => {
        console.log(`  ✅ DNS resolution successful: ${hostname} -> ${result.address}`);
      })
      .catch(err => {
        console.error(`  ❌ DNS resolution failed: ${err.message}`);
      });
    
    // Simple connectivity test
    const response = await fetch(`${SUPABASE_URL}/auth/v1/`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
      }
    });
    
    if (response.ok || response.status === 400) { // 400 is expected for auth endpoint without proper request
      console.log(`  ✅ Network connectivity test passed (status code ${response.status})`);
      return true;
    } else {
      console.error(`  ❌ Network connectivity test failed with status ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error(`  ❌ Network test error: ${error.message}`);
    console.log('    This could indicate network/firewall issues or DNS problems');
    return false;
  }
}

// Main test sequence
async function runTests() {
  // Get optional email/password from command line
  const email = process.argv[2];
  const password = process.argv[3];
  
  console.log('=== Supabase Connection Diagnostic ===');
  console.log(`URL: ${SUPABASE_URL.substring(0, 27)}...`);
  
  const connectionOk = await testConnection();
  const adminOk = await testAdminAccess();
  const authOk = await testAuth(email, password);
  const networkOk = await checkNetworkConnectivity();
  
  console.log('\n=== Summary ===');
  console.log('Database Connection:', connectionOk ? '✅ Working' : '❌ Failed');
  console.log('Admin Access:', adminOk ? '✅ Working' : supabaseAdmin ? '❌ Failed' : '⚠️ Not Tested');
  console.log('Authentication:', authOk === null ? '⚠️ Not Tested' : authOk ? '✅ Working' : '❌ Failed');
  console.log('Network Connectivity:', networkOk ? '✅ Working' : '❌ Issues Detected');
  
  if (!connectionOk) {
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Check your .env.local file for correct Supabase URL and API keys');
    console.log('2. Verify your IP is not blocked by any firewall rules in Supabase');
    console.log('3. Test if you can access Supabase Studio in your browser');
    console.log('4. Consider using a VPN to test if it\'s a network issue');
  }
  
  if (connectionOk && !adminOk && supabaseAdmin) {
    console.log('\n🔧 Admin access troubleshooting:');
    console.log('1. Verify your SUPABASE_SERVICE_ROLE_KEY is correct');
    console.log('2. Check if your service role has the necessary permissions');
  }
  
  return connectionOk || networkOk;
}

runTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  }); 