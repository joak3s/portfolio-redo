#!/usr/bin/env node

/**
 * Update Supabase User Directly
 * Usage: node update-user.js <email> <new_password>
 */

import { config } from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
config({ path: '.env.local' });

// Get command line arguments
const email = process.argv[2];
const password = process.argv[3];

// Validate input
if (!email || !password) {
  console.error('Usage: node update-user.js <email> <new_password>');
  process.exit(1);
}

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing required environment variables:');
  console.error('Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

async function updateUser() {
  try {
    console.log(`Attempting to update user: ${email}`);
    
    // First, get the user to ensure they exist
    const getUserResponse = await fetch(
      `${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey
        }
      }
    );
    
    const userData = await getUserResponse.json();
    
    if (!getUserResponse.ok) {
      throw new Error(`Failed to find user: ${JSON.stringify(userData)}`);
    }
    
    if (userData.users.length === 0) {
      throw new Error(`No user found with email: ${email}`);
    }
    
    const userId = userData.users[0].id;
    console.log(`Found user with ID: ${userId}`);
    
    // Update the user's password
    const updateResponse = await fetch(
      `${supabaseUrl}/auth/v1/admin/users/${userId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey
        },
        body: JSON.stringify({
          password: password
        })
      }
    );
    
    const updateData = await updateResponse.json();
    
    if (!updateResponse.ok) {
      throw new Error(`Failed to update user: ${JSON.stringify(updateData)}`);
    }
    
    console.log('User password updated successfully!');
    console.log('You can now log in with the new credentials.');
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

updateUser(); 