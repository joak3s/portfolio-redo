#!/usr/bin/env node

/**
 * Supabase Configuration Verification Script
 * 
 * This script checks your Supabase configuration and attempts a direct login
 * using the REST API to bypass any middleware or cookie issues.
 * 
 * Usage: node verify-supabase-config.js <email> <password>
 */

import { config } from 'dotenv';
import fetch from 'node-fetch';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from both files
config({ path: '.env.local' });
config({ path: '.env.development' });

// Get command line arguments
const email = process.argv[2];
const password = process.argv[3];

// Validate input
if (!email || !password) {
  console.error('Usage: node verify-supabase-config.js <email> <password>');
  process.exit(1);
}

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function verifySupabaseConfig() {
  console.log(`${colors.bright}========== SUPABASE CONFIGURATION CHECK ==========${colors.reset}\n`);
  
  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log(`${colors.cyan}Environment Variables:${colors.reset}`);
  console.log(`- NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? `${colors.green}Set${colors.reset}` : `${colors.red}Missing${colors.reset}`}`);
  console.log(`- NEXT_PUBLIC_SUPABASE_ANON_KEY: ${anonKey ? `${colors.green}Set${colors.reset} (starts with ${anonKey.substring(0, 5)}...)` : `${colors.red}Missing${colors.reset}`}`);
  console.log(`- SUPABASE_SERVICE_ROLE_KEY: ${serviceRoleKey ? `${colors.green}Set${colors.reset} (starts with ${serviceRoleKey.substring(0, 5)}...)` : `${colors.red}Missing${colors.reset}`}`);
  
  if (!supabaseUrl || !anonKey) {
    console.log(`\n${colors.red}Error: Missing required environment variables.${colors.reset}`);
    console.log('Please check your .env.local and .env.development files.');
    process.exit(1);
  }
  
  console.log('\n' + '-'.repeat(50) + '\n');
  
  // Test basic connectivity
  console.log(`${colors.cyan}Testing Supabase Connectivity:${colors.reset}`);
  try {
    const healthCheck = await fetch(`${supabaseUrl}/rest/v1/?apikey=${anonKey}`);
    const healthResult = healthCheck.ok 
      ? `${colors.green}Connected${colors.reset} (Status: ${healthCheck.status})` 
      : `${colors.red}Failed${colors.reset} (Status: ${healthCheck.status})`;
    
    console.log(`- Health Check: ${healthResult}`);
  } catch (error) {
    console.log(`- Health Check: ${colors.red}Failed${colors.reset} (${error.message})`);
  }

  console.log('\n' + '-'.repeat(50) + '\n');
  
  // Create an admin client
  console.log(`${colors.cyan}Testing Authentication with Admin API:${colors.reset}`);
  
  try {
    // First try with the JavaScript client
    const supabase = createClient(supabaseUrl, anonKey);
    
    console.log(`- Using API Key: ${anonKey.substring(0, 5)}...`);
    console.log(`- Target Email: ${email}`);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.log(`- Authentication: ${colors.red}Failed${colors.reset}`);
      console.log(`  Error: ${error.message} (${error.status})`);
    } else {
      console.log(`- Authentication: ${colors.green}Success${colors.reset}`);
      console.log(`  User ID: ${data.user.id}`);
      console.log(`  Email: ${data.user.email}`);
      console.log(`  Session expires: ${new Date(data.session.expires_at * 1000).toISOString()}`);
    }
  } catch (error) {
    console.log(`- Authentication: ${colors.red}Failed${colors.reset}`);
    console.log(`  Error: ${error.message}`);
  }
  
  console.log('\n' + '-'.repeat(50) + '\n');
  
  // Try using direct REST API
  console.log(`${colors.cyan}Testing Authentication with REST API:${colors.reset}`);
  
  try {
    const authResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });
    
    const authData = await authResponse.json();
    
    if (!authResponse.ok || authData.error) {
      console.log(`- REST Authentication: ${colors.red}Failed${colors.reset}`);
      console.log(`  Status: ${authResponse.status}`);
      console.log(`  Error: ${authData.error || authData.error_description || 'Unknown error'}`);
    } else {
      console.log(`- REST Authentication: ${colors.green}Success${colors.reset}`);
      console.log(`  User ID: ${authData.user.id}`);
      console.log(`  Email: ${authData.user.email}`);
      if (authData.access_token) {
        console.log(`  Access Token: ${authData.access_token.substring(0, 10)}...`);
      }
    }
  } catch (error) {
    console.log(`- REST Authentication: ${colors.red}Failed${colors.reset}`);
    console.log(`  Error: ${error.message}`);
  }
  
  console.log('\n' + '-'.repeat(50) + '\n');
  
  // Check for cookie issues
  console.log(`${colors.cyan}Supabase SSR Package Version:${colors.reset}`);
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    const ssrVersion = packageJson.dependencies['@supabase/ssr'] || 'Not installed';
    const authHelperVersion = packageJson.dependencies['@supabase/auth-helpers-nextjs'] || 'Not installed';
    
    console.log(`- @supabase/ssr: ${ssrVersion === 'Not installed' ? colors.yellow + ssrVersion + colors.reset : colors.green + ssrVersion + colors.reset}`);
    console.log(`- @supabase/auth-helpers-nextjs: ${authHelperVersion === 'Not installed' ? colors.green + authHelperVersion + colors.reset : colors.yellow + authHelperVersion + colors.reset} (deprecated)`);
    
    if (ssrVersion === 'Not installed' && authHelperVersion === 'Not installed') {
      console.log(`\n${colors.yellow}Warning: Neither Supabase SSR package is installed.${colors.reset}`);
      console.log('Consider installing the recommended package: npm install @supabase/ssr');
    }
    
    if (authHelperVersion !== 'Not installed') {
      console.log(`\n${colors.yellow}Warning: You're using the deprecated auth-helpers-nextjs package.${colors.reset}`);
      console.log('Consider migrating to the new @supabase/ssr package.');
    }
  } catch (error) {
    console.log(`- Error reading package.json: ${error.message}`);
  }
  
  console.log('\n' + '-'.repeat(50) + '\n');
  
  console.log(`${colors.bright}CONFIGURATION CHECK COMPLETE${colors.reset}\n`);
}

verifySupabaseConfig(); 