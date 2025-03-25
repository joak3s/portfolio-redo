'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase-server'

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return redirect('/auth/login?error=Please provide both email and password')
  }

  const supabase = await createServerComponentClient()

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      // Handle specific error cases
      if (error.message.includes('Invalid login credentials')) {
        return redirect('/auth/login?error=Invalid email or password')
      }
      if (error.message.includes('Email not confirmed')) {
        return redirect('/auth/login?error=Please confirm your email first')
      }
      return redirect('/auth/login?error=An error occurred during sign in')
    }

    // Set a secure cookie with the session
    const cookieStore = await cookies()
    cookieStore.set('auth_session', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    })

    return redirect('/admin')
  } catch (error) {
    console.error('Sign in error:', error)
    return redirect('/auth/login?error=An unexpected error occurred')
  }
}

export async function signOut() {
  const supabase = await createServerComponentClient()

  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Sign out error:', error)
      return redirect('/auth/login?error=Error signing out')
    }

    // Clear the auth cookie
    const cookieStore = await cookies()
    cookieStore.delete('auth_session')

    return redirect('/auth/login')
  } catch (error) {
    console.error('Sign out error:', error)
    return redirect('/auth/login?error=An unexpected error occurred')
  }
} 