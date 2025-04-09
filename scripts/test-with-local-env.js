/**
 * Test script that manually loads variables from .env.local
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Get the project root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Read .env.local file
const envPath = path.join(rootDir, '.env.local');

if (!fs.existsSync(envPath)) {
  console.error('.env.local file not found!');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

// Parse .env file
envContent.split('\n').forEach(line => {
  // Skip comments and empty lines
  if (line.startsWith('#') || !line.trim()) return;
  
  // Extract key and value
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    
    // Remove surrounding quotes if present
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    
    envVars[key] = value;
  }
});

console.log('Loaded environment variables:');
console.log(`NEXT_PUBLIC_SUPABASE_URL: ${envVars.NEXT_PUBLIC_SUPABASE_URL ? 'defined' : 'undefined'}`);
console.log(`SUPABASE_SERVICE_ROLE_KEY: ${envVars.SUPABASE_SERVICE_ROLE_KEY ? 'defined' : 'undefined'}`);

// Create temporary .env file for testing
const tempEnvPath = path.join(__dirname, '.env.temp');
fs.writeFileSync(tempEnvPath, 
  `NEXT_PUBLIC_SUPABASE_URL=${envVars.NEXT_PUBLIC_SUPABASE_URL}\n` +
  `SUPABASE_SERVICE_ROLE_KEY=${envVars.SUPABASE_SERVICE_ROLE_KEY}\n` +
  `NEXT_PUBLIC_API_URL=${envVars.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000'}\n`
);

console.log(`Created temporary env file at ${tempEnvPath}`);

// Run the test script with the temporary env file
try {
  console.log('Running test script...');
  console.log('------------------------------------------------------------');
  
  // Use execSync to run the script with the temporary env file
  execSync(`DOTENV_CONFIG_PATH=${tempEnvPath} node -r dotenv/config scripts/run-project-test.js`, {
    stdio: 'inherit',
    env: {
      ...process.env,
      ...envVars
    }
  });
  
} catch (error) {
  console.error('Error running test script:', error.message);
} finally {
  // Clean up the temporary file
  fs.unlinkSync(tempEnvPath);
  console.log('Removed temporary env file');
} 