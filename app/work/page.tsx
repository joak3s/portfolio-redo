"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import ProjectCard from "@/components/project-card"
import type { Project, Tool } from "@/lib/types"
import { supabaseClient } from "@/lib/supabase-browser"

export default function WorkPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [tools, setTools] = useState<Tool[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch both projects and tools
  useEffect(() => {
    async function fetchData() {
      try {
        // Use Supabase client directly instead of API routes
        const [projectsResponse, toolsResponse] = await Promise.all([
          supabaseClient
            .from('projects')
            .select(`
              *,
              project_images (*),
              tools:project_tools (
                tool:tools (*)
              )
            `)
            .eq('status', 'published')
            .order('featured', { ascending: true, nullsFirst: false }),
          supabaseClient
            .from('tools')
            .select('*')
            .order('name')
        ])
        
        if (projectsResponse.error) throw projectsResponse.error
        if (toolsResponse.error) throw toolsResponse.error

        const typedProjects = projectsResponse.data?.map((project: any) => ({
          ...project,
          status: project.status as "published" | "draft" || "draft",
          tools: project.tools?.map((pt: any) => pt.tool).filter(Boolean) || [],
        })) || []

        setProjects(typedProjects)
        setTools(toolsResponse.data || [])
        setFilteredProjects(typedProjects)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching data:", error)
        setLoading(false)
      }
    }

    fetchData()
  }, [supabaseClient])

  useEffect(() => {
    let result = projects

    // Filter by search term
    if (searchTerm) {
      result = result.filter(
        (project) =>
          project.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.tools?.some((tool) => tool.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          false
      )
    }

    // Filter by tool
    if (activeFilter && activeFilter !== "All") {
      result = result.filter((project) => 
        project.tools?.some(tool => tool.name === activeFilter)
      )
    }

    // Only show published projects (redundant since we filtered in the query, but keeping for safety)
    result = result.filter((project) => project.status === 'published')

    setFilteredProjects(result)
  }, [searchTerm, activeFilter, projects])

  // Create filter categories from available tools
  const categories = ["All", ...tools.map(tool => tool.name)]

  return (
    <div className="container py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-4xl font-bold mb-8">My Work</h1>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={activeFilter === category || (category === "All" && !activeFilter) ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter(category === "All" ? null : category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No projects found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                className="w-full"
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}

