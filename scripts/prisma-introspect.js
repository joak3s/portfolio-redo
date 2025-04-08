import dotenv from 'dotenv';
import { exec } from 'child_process';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Get the service role key from environment
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY not found in environment variables');
  process.exit(1);
}

// Generate database URL with the service role key
const projectRef = 'lgtldjzglbzlmmxphfxw';
const directUrl = `postgresql://postgres.${projectRef}:${serviceRoleKey}@aws-0-us-west-1.pooler.supabase.com:5432/postgres`;

// Run Prisma db pull command
const command = `npx prisma db pull --schema=./prisma/schema.prisma`;

// Set environment variables for the command
const env = {
  ...process.env,
  DIRECT_URL: directUrl,
  DATABASE_URL: `postgresql://postgres.${projectRef}:${serviceRoleKey}@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true`
};

// Execute the command
console.log('Running Prisma introspection...');
exec(command, { env }, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  
  if (stderr) {
    console.error(`stderr: ${stderr}`);
    return;
  }
  
  console.log(`stdout: ${stdout}`);
  console.log('Prisma introspection completed successfully!');
}); 