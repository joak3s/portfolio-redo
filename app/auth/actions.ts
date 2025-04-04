'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { clearAuthCookies } from '@/lib/auth-utils'
import { SUPABASE_CONFIG } from '@/lib/supabase-config'

export async function signIn(formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = (formData.get('password') as string)
  const returnUrl = formData.get('returnUrl') as string || '/admin'

  if (!email || !password) {
    console.log('Login attempt failed: Missing email or password')
    return redirect('/auth/login?error=Please provide both email and password')
  }

  console.log(`Auth attempt: ${email.substring(0, 3)}...@${email.split('@')[1]}, returnUrl: ${returnUrl}`)
  console.log(`Email length: ${email.length}, Password length: ${password.length}`)
  
  // Check which Supabase URL we're using (for debugging)
  console.log(`Using Supabase URL: ${SUPABASE_CONFIG.URL}`)

  // Create server-side Supabase client
  const supabase = await createServerSupabaseClient()
  
  // Attempt authentication with Supabase
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  // Handle authentication errors
  if (error) {
    console.error('Supabase auth error:', {
      message: error.message,
      status: error.status,
      name: error.name,
    })

    // Handle specific error cases
    if (error.message.includes('Invalid login credentials')) {
      return redirect('/auth/login?error=Invalid email or password')
    }
    if (error.message.includes('Email not confirmed')) {
      return redirect('/auth/login?error=Please confirm your email first')
    }
    
    // Generic error with more info
    return redirect(`/auth/login?error=${encodeURIComponent(`Auth error: ${error.message}`)}`)
  }

  // Log successful authentication
  console.log('Authentication successful for', email)
  console.log('User ID:', data.user.id)
  console.log('Session expires at:', data.session?.expires_at 
    ? new Date(data.session.expires_at * 1000).toISOString()
    : 'Not available')

  // Successful login - redirect to requested page
  return redirect(returnUrl)
}

export async function signOut() {
  try {
    // Get server-side Supabase client
    const supabase = await createServerSupabaseClient()
    
    // Sign out with Supabase
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Sign out error with Supabase:', error)
    }
    
    // Always clear cookies manually as a fallback
    await clearAuthCookies()
    
    console.log('User signed out successfully')
  } catch (error) {
    console.error('Sign out error:', error)
  }
  
  // Always redirect to login page
  return redirect('/auth/login')
} 