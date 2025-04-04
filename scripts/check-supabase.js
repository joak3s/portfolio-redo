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

// Check if required environment variables are set
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

console.log('Environment variables found:');
console.log(' - NEXT_PUBLIC_SUPABASE_URL:', `${SUPABASE_URL.substring(0, 20)}...`);
console.log(' - NEXT_PUBLIC_SUPABASE_ANON_KEY:', `${SUPABASE_ANON_KEY.substring(0, 10)}...`);
console.log(' - SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_KEY ? `${SUPABASE_SERVICE_KEY.substring(0, 10)}...` : 'not set');

// Create Supabase clients
const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseAdmin = SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;

// Test anonymous client connection
async function testAnonConnection() {
  try {
    console.log('\nTesting anonymous client connection...');
    const { data, error } = await supabaseAnon.from('projects').select('count(*)', { count: 'exact', head: true });
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Anonymous client connection successful!');
    return true;
  } catch (error) {
    console.error('❌ Anonymous client connection failed:', error.message);
    return false;
  }
}

// Test admin client connection and list users
async function testAdminConnection() {
  if (!supabaseAdmin) {
    console.log('\n❗ Skipping admin tests: Service role key not provided.');
    return false;
  }
  
  try {
    console.log('\nTesting admin client connection...');
    
    // First verify DB connection
    const { data: dbData, error: dbError } = await supabaseAdmin
      .from('projects')
      .select('count(*)', { count: 'exact', head: true });
    
    if (dbError) {
      throw dbError;
    }
    
    console.log('✅ Admin database connection successful!');
    
    // Then try listing users (auth admin privileges)
    console.log('\nListing users from auth.users table...');
    
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) {
      throw usersError;
    }
    
    console.log(`✅ Successfully retrieved users (${users.users.length} found):`);
    users.users.forEach(user => {
      console.log(` - ${user.email} (${user.id.substring(0, 8)}...)`);
    });
    
    return true;
  } catch (error) {
    console.error('❌ Admin connection or operation failed:', error.message);
    if (error.message.includes('auth.admin')) {
      console.error('   This might be due to lacking admin privileges or incorrect service role key.');
    }
    return false;
  }
}

// Test email/password login
async function testLogin(email, password) {
  if (!email || !password) {
    console.log('\n❗ Skipping login test: No credentials provided.');
    console.log('   Run with: node scripts/check-supabase.js test@example.com password123');
    return false;
  }
  
  try {
    console.log(`\nTesting login for ${email}...`);
    
    const { data, error } = await supabaseAnon.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Login successful!');
    console.log(` - User ID: ${data.user.id.substring(0, 8)}...`);
    console.log(` - Email: ${data.user.email}`);
    console.log(` - Auth provider: ${data.user.app_metadata.provider}`);
    console.log(` - Session expires: ${new Date(data.session.expires_at * 1000).toLocaleString()}`);
    
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  // Get email/password from command line args
  const email = process.argv[2];
  const password = process.argv[3];
  
  const anonResult = await testAnonConnection();
  const adminResult = await testAdminConnection();
  const loginResult = await testLogin(email, password);
  
  console.log('\n=== Supabase Connection Test Results ===');
  console.log('Anonymous connection:', anonResult ? '✓ PASS' : '✗ FAIL');
  console.log('Admin connection:', adminResult ? '✓ PASS' : supabaseAdmin ? '✗ FAIL' : '- SKIPPED');
  console.log('User authentication:', loginResult ? '✓ PASS' : email ? '✗ FAIL' : '- SKIPPED');
  
  // Exit with appropriate code
  process.exit(anonResult && (adminResult || !supabaseAdmin) && (loginResult || !email) ? 0 : 1);
}

runTests().catch(err => {
  console.error('Unhandled error during tests:', err);
  process.exit(1);
}); 