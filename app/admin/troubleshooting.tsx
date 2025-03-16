"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle, Info } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function AdminTroubleshooting() {
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({})
  const [isRunningTests, setIsRunningTests] = useState(false)

  const runTest = async (testName: string, testFn: () => Promise<{ success: boolean; message: string }>) => {
    try {
      setTestResults((prev) => ({ ...prev, [testName]: { success: false, message: "Running test..." } }))
      const result = await testFn()
      setTestResults((prev) => ({ ...prev, [testName]: result }))
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      setTestResults((prev) => ({
        ...prev,
        [testName]: { success: false, message: `Test failed: ${errorMessage}` },
      }))
      return { success: false, message: errorMessage }
    }
  }

  const testFetchProjects = async () => {
    try {
      const response = await fetch("/api/projects")

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (!Array.isArray(data)) {
        throw new Error("API did not return an array of projects")
      }

      return {
        success: true,
        message: `Successfully fetched ${data.length} projects`,
      }
    } catch (error) {
      throw error
    }
  }

  const testCreateProject = async () => {
    try {
      // Create a test project with a unique slug
      const timestamp = Date.now()
      const testProject = {
        name: `Test Project ${timestamp}`,
        slug: `test-project-${timestamp}`,
        short_summary: "This is a test project created by the troubleshooter",
        main_image: "/placeholder.svg?height=600&width=800",
        challenge: "Test challenge",
        approach: "Test approach",
        solution: "Test solution",
        results: "Test results",
        featured_order: 0,
        tools: ["Test"],
        website_link: "",
      }

      const createResponse = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testProject),
      })

      if (!createResponse.ok) {
        const errorData = await createResponse.json()
        throw new Error(`Failed to create test project: ${errorData.error || createResponse.statusText}`)
      }

      const createdProject = await createResponse.json()

      return {
        success: true,
        message: `Successfully created test project with slug: ${createdProject.slug}`,
      }
    } catch (error) {
      throw error
    }
  }

  const testUpdateProject = async () => {
    try {
      // First, create a test project
      const timestamp = Date.now()
      const testProject = {
        name: `Update Test ${timestamp}`,
        slug: `update-test-${timestamp}`,
        short_summary: "This is a test project for updating",
        main_image: "/placeholder.svg?height=600&width=800",
        featured_order: 0,
        tools: ["Test"],
      }

      const createResponse = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testProject),
      })

      if (!createResponse.ok) {
        throw new Error("Failed to create test project for update test")
      }

      const createdProject = await createResponse.json()

      // Now update the project
      const updatedData = {
        ...createdProject,
        name: `${createdProject.name} (Updated)`,
        short_summary: "This project has been updated by the troubleshooter",
      }

      const updateResponse = await fetch(`/api/projects/${createdProject.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      })

      if (!updateResponse.ok) {
        throw new Error(`Failed to update test project: ${updateResponse.statusText}`)
      }

      return {
        success: true,
        message: `Successfully updated test project with slug: ${createdProject.slug}`,
      }
    } catch (error) {
      throw error
    }
  }

  const testDeleteProject = async () => {
    try {
      // First, create a test project
      const timestamp = Date.now()
      const testProject = {
        name: `Delete Test ${timestamp}`,
        slug: `delete-test-${timestamp}`,
        short_summary: "This is a test project for deletion",
        main_image: "/placeholder.svg?height=600&width=800",
        featured_order: 0,
        tools: ["Test"],
      }

      const createResponse = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testProject),
      })

      if (!createResponse.ok) {
        throw new Error("Failed to create test project for delete test")
      }

      const createdProject = await createResponse.json()

      // Now delete the project
      const deleteResponse = await fetch(`/api/projects/${createdProject.slug}`, {
        method: "DELETE",
      })

      if (!deleteResponse.ok) {
        throw new Error(`Failed to delete test project: ${deleteResponse.statusText}`)
      }

      // Verify the project was deleted
      const verifyResponse = await fetch(`/api/projects/${createdProject.slug}`)

      if (verifyResponse.ok) {
        throw new Error("Project still exists after deletion")
      }

      return {
        success: true,
        message: `Successfully deleted test project with slug: ${createdProject.slug}`,
      }
    } catch (error) {
      throw error
    }
  }

  const runAllTests = async () => {
    setIsRunningTests(true)

    try {
      // Run tests in sequence
      const fetchResult = await runTest("fetchProjects", testFetchProjects)

      if (fetchResult.success) {
        const createResult = await runTest("createProject", testCreateProject)

        if (createResult.success) {
          await runTest("updateProject", testUpdateProject)
          await runTest("deleteProject", testDeleteProject)
        }
      }

      toast({
        title: "Tests completed",
        description: "All tests have been completed. Check the results for details.",
      })
    } catch (error) {
      console.error("Error running tests:", error)
      toast({
        title: "Error",
        description: "An error occurred while running tests",
        variant: "destructive",
      })
    } finally {
      setIsRunningTests(false)
    }
  }

  return (
    <div className="container py-8 md:py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-6">Admin Troubleshooting</h1>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>CRUD Operations Test</CardTitle>
            <CardDescription>Test the Create, Read, Update, and Delete operations for projects</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              This tool will run a series of tests to verify that all CRUD operations are working correctly. It will
              create temporary test projects and then clean them up afterward.
            </p>

            <Alert className="mb-4">
              <Info className="h-4 w-4" />
              <AlertTitle>Information</AlertTitle>
              <AlertDescription>
                These tests will modify your project data by creating and deleting test projects. While they are
                designed to clean up after themselves, you may need to manually delete any test projects if a test
                fails.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              {Object.entries(testResults).map(([testName, result]) => (
                <div key={testName} className="p-4 border rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    {result.success ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    )}
                    <h3 className="font-medium">{testName}</h3>
                  </div>
                  <p className={result.success ? "text-green-600" : "text-destructive"}>{result.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={runAllTests} disabled={isRunningTests} className="w-full">
              {isRunningTests ? "Running Tests..." : "Run All Tests"}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting Guide</CardTitle>
            <CardDescription>Common issues and solutions for the Admin page</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Projects aren't loading</AccordionTrigger>
                <AccordionContent>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>
                      Check that the API route <code>/api/projects</code> is accessible
                    </li>
                    <li>
                      Verify that your <code>projects.json</code> file exists in the data directory
                    </li>
                    <li>Ensure the JSON file contains valid JSON data</li>
                    <li>Check browser console for any JavaScript errors</li>
                    <li>Try refreshing the page or clearing your browser cache</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger>Can't create a new project</AccordionTrigger>
                <AccordionContent>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>Ensure all required fields (name, slug, short summary) are filled out</li>
                    <li>Check that the slug is unique and contains only lowercase letters, numbers, and hyphens</li>
                    <li>
                      Verify that the API route <code>/api/projects</code> accepts POST requests
                    </li>
                    <li>Check that the data directory is writable by the application</li>
                    <li>Look for error messages in the browser console or server logs</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger>Can't update an existing project</AccordionTrigger>
                <AccordionContent>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>Verify that you're using the correct slug in the API request</li>
                    <li>
                      Check that the API route <code>/api/projects/[slug]</code> accepts PUT requests
                    </li>
                    <li>Ensure all required fields are still present in the updated data</li>
                    <li>If changing the slug, make sure the new slug is unique</li>
                    <li>Check that the data directory is writable by the application</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger>Can't delete a project</AccordionTrigger>
                <AccordionContent>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>Verify that you're using the correct slug in the API request</li>
                    <li>
                      Check that the API route <code>/api/projects/[slug]</code> accepts DELETE requests
                    </li>
                    <li>Ensure the project exists before attempting to delete it</li>
                    <li>Check that the data directory is writable by the application</li>
                    <li>Look for error messages in the browser console or server logs</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5">
                <AccordionTrigger>Projects don't appear on the frontend</AccordionTrigger>
                <AccordionContent>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>Check that the project has a valid slug</li>
                    <li>Verify that the project data is complete (all required fields)</li>
                    <li>For featured projects, ensure the featured_order is greater than 0</li>
                    <li>Check that the API routes are correctly fetching project data</li>
                    <li>Clear your browser cache or try a hard refresh (Ctrl+F5)</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

