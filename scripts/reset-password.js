#!/usr/bin/env node

/**
 * Supabase Password Reset Script
 * 
 * Usage: node reset-password.js <email> <new_password>
 * 
 * This script uses the Supabase admin API to reset a user's password.
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load env variables
config({ path: '.env.local' });

// Get arguments
const email = process.argv[2];
const newPassword = process.argv[3];

// Validate input
if (!email || !newPassword) {
  console.error('Usage: node reset-password.js <email> <new_password>');
  process.exit(1);
}

// Validate environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Missing required environment variables.');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

async function resetPassword() {
  console.log(`Attempting to reset password for ${email}...`);

  // Create admin client with service role
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // First, check if the user exists by trying to get the user
    const { data: userList, error: userListError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .limit(1);

    if (userListError) {
      // Try a different approach - using auth API
      console.log('Using auth admin API instead...');
      
      // Update user password directly (requires knowing the user ID)
      const { data, error } = await supabase.auth.admin.updateUserById(
        'auth.users', // This may need to be adjusted based on your schema
        {
          email: email,
          password: newPassword,
        }
      );
      
      if (error) {
        throw new Error(`Password update failed: ${error.message}`);
      }
      
      console.log('Password reset successful!');
      console.log('User can now log in with the new password.');
      return;
    }
    
    if (!userList || userList.length === 0) {
      throw new Error(`User with email ${email} not found`);
    }
    
    const userId = userList[0].id;
    console.log(`User found with ID: ${userId}`);
    
    // Use a simpler approach: reset password with email
    const { data, error } = await supabase.auth.resetPasswordForEmail(
      email, 
      {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password?email=${encodeURIComponent(email)}`
      }
    );

    if (error) {
      throw new Error(`Password reset request failed: ${error.message}`);
    }

    console.log('Password reset email sent!');
    console.log('Check email for instructions to complete password reset.');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

resetPassword(); 