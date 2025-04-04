import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { LoginForm } from '@/components/auth/login-form'

export const metadata: Metadata = {
  title: 'Admin Login',
  description: 'Login to access the admin dashboard',
}

// Add more console output for debugging
function logSessionInfo(session: any) {
  if (session) {
    console.log('Found existing session for user:', session.user.email);
    const expiresAt = new Date(session.expires_at * 1000).toISOString();
    console.log(`Session expires at: ${expiresAt}`);
  } else {
    console.log('No active session found, showing login form');
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; returnUrl?: string }
}) {
  console.log('Login page loaded with params:', searchParams);

  // Get server-side Supabase client
  const supabase = await createServerSupabaseClient()

  // Check if user already has a session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Log session info for debugging
  logSessionInfo(session);

  // If already logged in, redirect to admin or returnUrl
  if (session) {
    const redirectTo = searchParams.returnUrl || '/admin'
    console.log(`User already logged in, redirecting to: ${redirectTo}`);
    redirect(redirectTo)
  }

  // Otherwise, show the login form
  return <LoginForm />
} 