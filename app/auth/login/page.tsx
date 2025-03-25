import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@/lib/supabase-server'
import LoginForm from '@/components/auth/login-form'

export const metadata: Metadata = {
  title: 'Admin Login',
  description: 'Login to access the admin dashboard',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { message: string }
}) {
  const supabase = await createServerComponentClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    redirect('/')
  }

  return <LoginForm error={searchParams.message} />
} 