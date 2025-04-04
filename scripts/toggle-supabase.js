#!/usr/bin/env node

/**
 * Supabase Environment Toggle Script
 * 
 * This script helps switch between local and remote Supabase instances.
 * It handles both Docker containers and environment settings.
 * 
 * Usage:
 *   node scripts/toggle-supabase.js remote  # Use remote Supabase instance
 *   node scripts/toggle-supabase.js local   # Use local Supabase instance
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Get the desired environment from command line
const targetEnv = process.argv[2]?.toLowerCase();

if (!targetEnv || (targetEnv !== 'local' && targetEnv !== 'remote')) {
  console.error('Error: You must specify either "local" or "remote"');
  console.log('Usage:');
  console.log('  node scripts/toggle-supabase.js remote   # Use remote Supabase');
  console.log('  node scripts/toggle-supabase.js local    # Use local Supabase');
  process.exit(1);
}

console.log(`\n🔄 Switching to ${targetEnv.toUpperCase()} Supabase environment...\n`);

// Paths to environment files
const envDevelopmentPath = path.join(process.cwd(), '.env.development');

// Handle Docker containers for local Supabase
if (targetEnv === 'local') {
  try {
    console.log('🐳 Starting local Supabase containers...');
    execSync('npx supabase start', { stdio: 'inherit' });
    console.log('✅ Local Supabase instance is running\n');
  } catch (error) {
    console.error('❌ Failed to start local Supabase:', error.message);
    console.log('Try running "npx supabase stop" first, then try again.\n');
  }
} else {
  try {
    console.log('🛑 Stopping local Supabase containers...');
    execSync('npx supabase stop', { stdio: 'inherit' });
    console.log('✅ Local Supabase instance stopped\n');
  } catch (error) {
    console.log('ℹ️ No local Supabase containers were running\n');
  }
}

// Create a temporary backup to avoid data loss
if (fs.existsSync(envDevelopmentPath)) {
  fs.copyFileSync(envDevelopmentPath, `${envDevelopmentPath}.bak`);
  console.log('📋 Backed up .env.development file\n');
}

// Update .env.development file to use the appropriate configuration
try {
  console.log(`📝 Updating .env.development with ${targetEnv} configuration...`);
  
  // Read current .env.development
  let envContent = fs.readFileSync(envDevelopmentPath, 'utf8');
  
  if (targetEnv === 'remote') {
    // Uncomment remote configuration, comment out local
    envContent = envContent.replace(
      /^NEXT_PUBLIC_SUPABASE_URL=http/m, 
      '# NEXT_PUBLIC_SUPABASE_URL=http'
    );
    envContent = envContent.replace(
      /^NEXT_PUBLIC_SUPABASE_ANON_KEY=.*demo.*$/m, 
      '# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
    );
    envContent = envContent.replace(
      /^SUPABASE_SERVICE_ROLE_KEY=.*demo.*$/m, 
      '# SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
    );
    
    // Make sure remote configuration is uncommented
    envContent = envContent.replace(
      /^# NEXT_PUBLIC_SUPABASE_URL=https/m, 
      'NEXT_PUBLIC_SUPABASE_URL=https'
    );
  } 
  else if (targetEnv === 'local') {
    // Uncomment local configuration, comment out remote
    envContent = envContent.replace(
      /^NEXT_PUBLIC_SUPABASE_URL=https/m, 
      '# NEXT_PUBLIC_SUPABASE_URL=https'
    );
    
    // Uncomment local configuration
    envContent = envContent.replace(
      /^# NEXT_PUBLIC_SUPABASE_URL=http/m, 
      'NEXT_PUBLIC_SUPABASE_URL=http'
    );
    envContent = envContent.replace(
      /^# NEXT_PUBLIC_SUPABASE_ANON_KEY=.*demo.*$/m, 
      'NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
    );
    envContent = envContent.replace(
      /^# SUPABASE_SERVICE_ROLE_KEY=.*demo.*$/m, 
      'SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
    );
  }
  
  // Write updated content back to .env.development
  fs.writeFileSync(envDevelopmentPath, envContent);
  console.log('✅ Environment variables updated\n');
} catch (error) {
  console.error('❌ Failed to update environment variables:', error.message);
  console.log('Restoring backup...');
  fs.copyFileSync(`${envDevelopmentPath}.bak`, envDevelopmentPath);
}

console.log(`🔴 IMPORTANT: You need to restart your Next.js server for changes to take effect.`);
console.log('Run: npm run dev\n');

// Remind about the client-side hardcoded values
console.log(`⚠️  Note: Client components use hardcoded values in lib/supabase-browser.ts`);
console.log(`   If you're switching to local development, you need to update that file too.\n`);

console.log(`✨ Successfully configured for ${targetEnv.toUpperCase()} Supabase instance`); 