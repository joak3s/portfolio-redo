"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, ArrowLeft, CheckCircle, Info, Loader2, XCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { supabaseClient } from "@/lib/supabase-browser"

export default function TroubleshootingPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [healthData, setHealthData] = useState<any>(null)
  const [authStatus, setAuthStatus] = useState<'checking' | 'authenticated' | 'unauthenticated'>('checking')
  const [authDetails, setAuthDetails] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()
    checkHealth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { session }, error: authError } = await supabaseClient.auth.getSession()
      
      if (authError) {
        console.error('Auth check error:', authError)
        setAuthStatus('unauthenticated')
        setAuthDetails({ error: authError.message })
        return
      }
      
      if (!session) {
        setAuthStatus('unauthenticated')
        setAuthDetails({ message: "No active session found" })
        return
      }
      
      setAuthStatus('authenticated')
      setAuthDetails({
        email: session.user?.email,
        id: session.user?.id,
        expires_at: new Date(session.expires_at! * 1000).toLocaleString(),
      })
    } catch (error) {
      console.error('Auth check error:', error)
      setAuthStatus('unauthenticated')
      setAuthDetails({ error: error instanceof Error ? error.message : "Unknown error" })
    }
  }

  const checkHealth = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Fetch health data from the debug API
      const response = await fetch('/api/debug')
      
      if (!response.ok) {
        let errorText = `Server error (${response.status})`
        
        // Try to parse error if present
        try {
          const errorData = await response.json()
          if (errorData.error) {
            errorText = `${errorText}: ${errorData.error}`
          }
        } catch (e) {
          // Ignore parse error, use status code message
        }
        
        throw new Error(errorText)
      }
      
      const data = await response.json()
      setHealthData(data)
    } catch (error) {
      console.error('Error fetching health data:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch server health')
      toast({ 
        title: "Error", 
        description: "Failed to check server health", 
        variant: "destructive" 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    checkHealth()
    checkAuth()
  }

  return (
    <div className="container py-8 md:py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold">Troubleshooting</h1>
          <div className="flex flex-col md:flex-row gap-2">
            <Button onClick={handleRefresh} variant="outline" className="w-full md:w-auto">
              Refresh Status
            </Button>
            <Button variant="outline" className="w-full md:w-auto" asChild>
              <Link href="/admin">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Admin
              </Link>
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-muted-foreground">Checking system status...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Authentication Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>Authentication Status</span>
                  {authStatus === 'authenticated' && (
                    <Badge className="bg-green-500 text-white">Active</Badge>
                  )}
                  {authStatus === 'unauthenticated' && (
                    <Badge variant="destructive">Inactive</Badge>
                  )}
                  {authStatus === 'checking' && (
                    <Badge variant="outline">Checking...</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {authStatus === 'checking' && (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <p>Checking authentication status...</p>
                  </div>
                )}
                
                {authStatus === 'authenticated' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <CheckCircle className="h-5 w-5" />
                      <p className="font-medium">You are authenticated</p>
                    </div>
                    
                    <div className="rounded-md bg-muted p-3 text-sm">
                      <div className="grid grid-cols-2 gap-1">
                        <span className="font-medium">Email:</span>
                        <span>{authDetails?.email}</span>
                        
                        <span className="font-medium">User ID:</span>
                        <span className="truncate">{authDetails?.id}</span>
                        
                        <span className="font-medium">Session Expires:</span>
                        <span>{authDetails?.expires_at}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {authStatus === 'unauthenticated' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-destructive">
                      <XCircle className="h-5 w-5" />
                      <p className="font-medium">You are not authenticated</p>
                    </div>
                    
                    {authDetails?.error && (
                      <Alert variant="destructive" className="text-sm">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Authentication Error</AlertTitle>
                        <AlertDescription>{authDetails.error}</AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="rounded-md bg-muted p-3 text-sm">
                      <p>Please sign in to access admin features:</p>
                      <div className="flex flex-col gap-2 mt-2">
                        <Button 
                          variant="default" 
                          className="w-full"
                          onClick={() => router.push('/auth/login?returnUrl=/admin')}
                        >
                          Sign In
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          asChild
                        >
                          <Link href="/admin/auth-check">
                            Advanced Auth Diagnostics
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Server Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>Server Health</span>
                  {healthData?.health?.server === 'OK' && (
                    <Badge className="bg-green-500 text-white">Healthy</Badge>
                  )}
                  {healthData?.health?.server !== 'OK' && (
                    <Badge variant="destructive">Issues Detected</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {healthData && (
                  <div className="space-y-4">
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="health">
                        <AccordionTrigger className="text-left">
                          <div className="flex items-center gap-2">
                            <Info className="h-4 w-4" />
                            Server Configuration
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="rounded-md bg-muted p-3 text-sm">
                            <div className="grid grid-cols-2 gap-2">
                              <span className="font-medium">Environment:</span>
                              <span>{healthData.health.nodeEnv}</span>
                              
                              <span className="font-medium">Timestamp:</span>
                              <span>{new Date(healthData.health.timestamp).toLocaleString()}</span>
                              
                              <span className="font-medium">Supabase URL:</span>
                              <span>{healthData.health.nextPublicSupabaseUrl}</span>
                              
                              <span className="font-medium">Supabase Anon Key:</span>
                              <span>{healthData.health.nextPublicSupabaseAnonKey}</span>
                              
                              <span className="font-medium">Service Role Key:</span>
                              <span>{healthData.health.supabaseServiceRoleKey}</span>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                      
                      <AccordionItem value="database">
                        <AccordionTrigger className="text-left">
                          <div className="flex items-center gap-2">
                            {healthData.supabase.admin.success ? (
                              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                            ) : (
                              <XCircle className="h-4 w-4 text-destructive" />
                            )}
                            Database Connection
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="rounded-md bg-muted p-3 text-sm">
                            <div className="space-y-2">
                              <div className="flex gap-2">
                                <span className="font-medium">Status:</span>
                                <span>{healthData.supabase.admin.success ? 'Connected' : 'Connection Failed'}</span>
                              </div>
                              
                              <div className="flex gap-2">
                                <span className="font-medium">Message:</span>
                                <span>{healthData.supabase.admin.message}</span>
                              </div>
                              
                              {healthData.supabase.admin.error && (
                                <Alert variant="destructive" className="mt-2 text-sm">
                                  <AlertCircle className="h-4 w-4" />
                                  <AlertTitle>Database Error</AlertTitle>
                                  <AlertDescription>
                                    {typeof healthData.supabase.admin.error === 'string'
                                      ? healthData.supabase.admin.error
                                      : JSON.stringify(healthData.supabase.admin.error, null, 2)}
                                  </AlertDescription>
                                </Alert>
                              )}
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                    
                    {healthData.supabase.admin.success ? (
                      <Alert className="bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-300">
                        <CheckCircle className="h-4 w-4" />
                        <AlertTitle>All Systems Operational</AlertTitle>
                        <AlertDescription>
                          The server and database connections are working correctly.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Database Connection Issue</AlertTitle>
                        <AlertDescription>
                          There's a problem connecting to the database. Check your environment variables
                          and Supabase settings.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* API Test */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>API Connection Test</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Use these buttons to test basic API endpoints. This can help diagnose issues with authentication,
                    permissions, or API configuration.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button 
                      variant="outline"
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/admin/projects')
                          
                          if (!response.ok) {
                            throw new Error(`Error: ${response.status} ${response.statusText}`)
                          }
                          
                          const data = await response.json()
                          toast({
                            title: "Projects API Success",
                            description: `Retrieved ${data.length} projects`,
                          })
                        } catch (error) {
                          toast({
                            title: "Projects API Error",
                            description: error instanceof Error ? error.message : "Unknown error",
                            variant: "destructive",
                          })
                        }
                      }}
                    >
                      Test Projects API
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/admin/tools')
                          
                          if (!response.ok) {
                            throw new Error(`Error: ${response.status} ${response.statusText}`)
                          }
                          
                          const data = await response.json()
                          toast({
                            title: "Tools API Success",
                            description: `Retrieved ${data.length} tools`,
                          })
                        } catch (error) {
                          toast({
                            title: "Tools API Error",
                            description: error instanceof Error ? error.message : "Unknown error",
                            variant: "destructive",
                          })
                        }
                      }}
                    >
                      Test Tools API
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/debug')
                          
                          if (!response.ok) {
                            throw new Error(`Error: ${response.status} ${response.statusText}`)
                          }
                          
                          await response.json()
                          toast({
                            title: "Debug API Success",
                            description: "Debug endpoint is working correctly",
                          })
                        } catch (error) {
                          toast({
                            title: "Debug API Error",
                            description: error instanceof Error ? error.message : "Unknown error",
                            variant: "destructive",
                          })
                        }
                      }}
                    >
                      Test Debug API
                    </Button>
                  </div>
                  
                  <div className="flex justify-center mt-4">
                    <Button variant="link" asChild className="text-sm">
                      <Link href="/admin/auth-check">
                        Go to Advanced Auth Diagnostics
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </motion.div>
    </div>
  )
}

