import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import LoginForm from '@/components/auth/login-form'

export const metadata: Metadata = {
  title: 'Admin Login',
  description: 'Login to access the admin dashboard',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { message: string; returnUrl?: string }
}) {
  const supabase = await createServerSupabaseClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If already logged in, redirect to admin or returnUrl
  if (session) {
    const redirectTo = searchParams.returnUrl || '/admin'
    redirect(redirectTo)
  }

  return <LoginForm error={searchParams.message} returnUrl={searchParams.returnUrl} />
} 