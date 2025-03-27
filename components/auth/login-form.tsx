'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { signIn } from '@/app/auth/actions'
import { Loader2 } from 'lucide-react'

interface LoginFormProps {
  error?: string
  returnUrl?: string
}

export default function LoginForm({ error, returnUrl }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(error || null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setFormError(null)

    try {
      const formData = new FormData(e.currentTarget)
      
      // Add returnUrl to formData if it exists
      if (returnUrl) {
        formData.append('returnUrl', returnUrl)
      }
      
      await signIn(formData)
    } catch (err) {
      setFormError('An error occurred during sign in. Please try again.')
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
              {(formError || error) && (
                <Alert variant="destructive">
                  <AlertDescription>{formError || error}</AlertDescription>
                </Alert>
              )}
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 