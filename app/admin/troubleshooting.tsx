"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Project, ProjectCreate, ProjectUpdate } from "@/lib/types"

export default function AdminTroubleshooting() {
  const [results, setResults] = useState<{
    operation: string
    success: boolean
    data?: any
    error?: string
  }[]>([])

  const addResult = (operation: string, success: boolean, data?: any, error?: string) => {
    setResults(prev => [{
      operation,
      success,
      data,
      error
    }, ...prev])
  }

  // Test GET all projects
  const testGetProjects = async () => {
    try {
      const response = await fetch("/api/admin/projects")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch projects")
      }

      addResult("GET /api/admin/projects", true, data)
    } catch (error) {
      addResult("GET /api/admin/projects", false, undefined, error instanceof Error ? error.message : "Unknown error")
    }
  }

  // Test POST new project
  const testCreateProject = async () => {
    try {
      const newProject: ProjectCreate = {
        title: "Test Project " + new Date().toISOString(),
        description: "Test Description",
        slug: "test-project-" + Date.now(),
        challenge: "Test Challenge",
        approach: "Test Approach",
        solution: "Test Solution",
        results: "Test Results",
        website_url: "https://example.com",
        featured: 0,
        status: "draft",
        priority: 0,
        images: [{
          url: "https://via.placeholder.com/300",
          alt_text: "Test Image",
          order_index: 0
        }],
        tool_ids: [],
        tag_ids: []
      }

      const response = await fetch("/api/admin/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newProject)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create project")
      }

      addResult("POST /api/admin/projects", true, data)
      return data.id // Return the ID for update/delete tests
    } catch (error) {
      addResult("POST /api/admin/projects", false, undefined, error instanceof Error ? error.message : "Unknown error")
      return null
    }
  }

  // Test PUT update project
  const testUpdateProject = async (id: string) => {
    try {
      const updateData: ProjectUpdate = {
        id,
        title: "Updated Test Project " + new Date().toISOString(),
        description: "Updated Test Description",
        images: [{
          url: "https://via.placeholder.com/400",
          alt_text: "Updated Test Image",
          order_index: 0
        }],
        tool_ids: [],
        tag_ids: []
      }

      const response = await fetch(`/api/admin/projects/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(updateData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update project")
      }

      addResult("PUT /api/admin/projects/" + id, true, data)
    } catch (error) {
      addResult("PUT /api/admin/projects/" + id, false, undefined, error instanceof Error ? error.message : "Unknown error")
    }
  }

  // Test DELETE project
  const testDeleteProject = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/projects/${id}`, {
        method: "DELETE"
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete project")
      }

      addResult("DELETE /api/admin/projects/" + id, true, data)
    } catch (error) {
      addResult("DELETE /api/admin/projects/" + id, false, undefined, error instanceof Error ? error.message : "Unknown error")
    }
  }

  // Run full CRUD test
  const runFullTest = async () => {
    // Clear previous results
    setResults([])

    // Test GET
    await testGetProjects()

    // Test POST and get the new project ID
    const newProjectId = await testCreateProject()
    if (!newProjectId) {
      addResult("Full Test", false, undefined, "Failed to create test project")
      return
    }

    // Wait a bit to ensure the project is created
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Test PUT
    await testUpdateProject(newProjectId)

    // Wait a bit to ensure the project is updated
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Test DELETE
    await testDeleteProject(newProjectId)
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Admin API Troubleshooting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button onClick={testGetProjects}>
              Test GET Projects
            </Button>
            <Button onClick={testCreateProject}>
              Test Create Project
            </Button>
            <Button onClick={runFullTest}>
              Run Full CRUD Test
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg ${
                  result.success ? "bg-green-50 text-green-900" : "bg-red-50 text-red-900"
                }`}
              >
                <h3 className="font-semibold">{result.operation}</h3>
                <p className="text-sm">
                  Status: {result.success ? "Success" : "Failed"}
                </p>
                {result.error && (
                  <p className="text-sm text-red-600">Error: {result.error}</p>
                )}
                {result.data && (
                  <pre className="mt-2 text-xs overflow-auto max-h-40">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

