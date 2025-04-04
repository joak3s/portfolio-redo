import { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Auth Diagnostics',
  description: 'Debug authentication information',
}

export default async function DebugAuthPage() {
  // Get server-side Supabase client
  const supabase = await createServerSupabaseClient()

  // Check if user already has a session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Get environment info
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-2xl space-y-6 rounded-lg border border-border bg-card p-6 shadow-md">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Auth Diagnostics</h1>
          <p className="text-muted-foreground">
            This page shows information about your current authentication state.
          </p>
        </div>

        <div className="space-y-4">
          <div className="rounded-md bg-muted p-4">
            <h2 className="text-lg font-semibold">Session Status</h2>
            {session ? (
              <div className="mt-2 space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-green-500"></span>
                  <span className="font-medium text-green-600 dark:text-green-400">Authenticated</span>
                </div>
                <div className="rounded-md bg-secondary/50 p-3 text-sm font-mono">
                  <div>User ID: {session.user.id}</div>
                  <div>Email: {session.user.email}</div>
                  <div>Created: {new Date(session.user.created_at).toLocaleString()}</div>
                  <div>Session Expires: {session.expires_at 
                    ? new Date(session.expires_at * 1000).toLocaleString() 
                    : 'Not available'}</div>
                </div>
              </div>
            ) : (
              <div className="mt-2 space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-red-500"></span>
                  <span className="font-medium text-red-600 dark:text-red-400">Not Authenticated</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  No active session found. Try logging in first.
                </p>
              </div>
            )}
          </div>

          <div className="rounded-md bg-muted p-4">
            <h2 className="text-lg font-semibold">Environment</h2>
            <div className="mt-2 space-y-2 text-sm">
              <div>
                <span className="font-medium">Supabase URL:</span>{' '}
                <code className="rounded bg-secondary/50 px-1 py-0.5">
                  {supabaseUrl?.substring(0, 20)}...
                </code>
              </div>
              <div>
                <span className="font-medium">Anon Key:</span>{' '}
                <code className="rounded bg-secondary/50 px-1 py-0.5">
                  {supabaseAnonKey?.substring(0, 10)}...
                </code>
              </div>
              <div>
                <span className="font-medium">Environment:</span>{' '}
                <code className="rounded bg-secondary/50 px-1 py-0.5">
                  {process.env.NODE_ENV}
                </code>
              </div>
            </div>
          </div>

          <div className="rounded-md bg-muted p-4">
            <h2 className="text-lg font-semibold">Troubleshooting</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              <li>
                <Link 
                  href="/auth/login" 
                  className="text-primary hover:underline"
                >
                  Login Page
                </Link>
              </li>
              <li>
                <Link 
                  href="/scripts/clear-cookies-guide.md" 
                  target="_blank"
                  className="text-primary hover:underline"
                >
                  Cookie Clearing Guide
                </Link>
              </li>
              <li>
                Try using the script: <code className="rounded bg-secondary/50 px-1 py-0.5">
                  node scripts/verify-supabase-config.js [email] [password]
                </code>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end">
          <Link 
            href="/"
            className="text-sm text-primary hover:underline"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
} 