import dotenv from 'dotenv';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Get the service role key from environment
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!serviceRoleKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY not found in environment variables');
  process.exit(1);
}

if (!supabaseUrl) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL not found in environment variables');
  process.exit(1);
}

// Extract the project reference from the Supabase URL
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)[1];

// Generate database URLs
const directUrl = `postgresql://postgres.${projectRef}:${serviceRoleKey}@aws-0-us-west-1.pooler.supabase.com:5432/postgres`;
const databaseUrl = `postgresql://postgres.${projectRef}:${serviceRoleKey}@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true`;

// Get migration command from arguments
const args = process.argv.slice(2);
let command = 'npx prisma migrate dev';

// Add name argument if provided
if (args.length > 0 && args[0] === '--name' && args.length > 1) {
  command += ` --name ${args[1]}`;
}

// Get confirmation
console.log('⚠️  You are about to run a Prisma migration on your Supabase database');
console.log(`Command: ${command}`);
console.log('\n⚠️  This will modify your database schema. Make sure you have a backup.');
console.log('Press ENTER to continue or CTRL+C to cancel...');

// Wait for user input before proceeding
process.stdin.once('data', () => {
  // Set environment variables for the command
  const env = {
    ...process.env,
    DIRECT_URL: directUrl,
    DATABASE_URL: databaseUrl
  };

  // Execute the command
  console.log('\nRunning Prisma migration...');
  exec(command, { env }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    
    if (stderr) {
      console.error(`stderr: ${stderr}`);
    }
    
    console.log(`stdout: ${stdout}`);
    console.log('Prisma migration completed!');
    process.exit(0);
  });
}); 