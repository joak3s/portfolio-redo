'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { RocketIcon, AlertTriangleIcon } from 'lucide-react'
import { signIn } from '@/app/auth/actions'
import Link from 'next/link'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [showDebug, setShowDebug] = useState(false)
  
  // Get error message from URL if present
  const errorFromUrl = searchParams.get('error')
  
  // Get return URL (where to redirect after login)
  const returnUrl = searchParams.get('returnUrl') || '/admin'

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setFormError(null)
    
    try {
      const formData = new FormData(e.currentTarget)
      const email = formData.get('email') as string
      const password = formData.get('password') as string
      
      // Add returnUrl to formData
      formData.set('returnUrl', returnUrl)
      
      // Debug info (redacted for security)
      console.log(`Login attempt: ${email.substring(0, 3)}...@${email.split('@')[1]}, returnUrl: ${returnUrl}`)
      console.log(`Email length: ${email.length}, Password length: ${password.length}`)
      
      // If either field is empty, show an error
      if (!email || !password) {
        setFormError('Please provide both email and password.')
        setIsLoading(false)
        return
      }
      
      // Call the server action
      await signIn(formData)
      
      // If we get here, we need to redirect (server action might have failed)
      // This should not usually happen because signIn redirects on success/failure
      router.push(returnUrl)
    } catch (error) {
      console.error('Login form error:', error)
      setFormError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm space-y-6">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
          <CardDescription>
            Enter your credentials to access the admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  placeholder="admin@example.com"
                  required
                  type="email"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  required
                  type="password"
                  disabled={isLoading}
                />
              </div>
              {(errorFromUrl || formError) && (
                <Alert variant="destructive">
                  <AlertTriangleIcon className="h-4 w-4" />
                  <AlertTitle>Authentication Error</AlertTitle>
                  <AlertDescription>
                    {errorFromUrl || formError}
                  </AlertDescription>
                </Alert>
              )}
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <div className="w-full flex justify-between items-center text-xs text-muted-foreground">
            <button 
              type="button"
              className="flex items-center gap-1 hover:underline"
              onClick={() => setShowDebug(!showDebug)}
            >
              <RocketIcon className="h-3 w-3" />
              {showDebug ? 'Hide Debug Info' : 'Show Debug Info'}
            </button>
            
            <Link href="/debug-auth" className="hover:underline">
              Auth Diagnostics →
            </Link>
          </div>
          
          {showDebug && (
            <div className="mt-2 w-full p-2 bg-muted rounded-md text-xs">
              <p className="font-semibold mb-1">Login Troubleshooting:</p>
              <ul className="space-y-1 list-disc pl-4">
                <li>Return URL: {returnUrl}</li>
                <li>Error: {errorFromUrl || 'None'}</li>
                <li>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 15)}...</li>
              </ul>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  )
} 