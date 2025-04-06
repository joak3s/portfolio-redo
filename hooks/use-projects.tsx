"use client"

import { useState, useEffect } from "react"
import type { Project } from "@/lib/types"
import { supabaseClient } from "@/lib/supabase-browser"

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchProjects() {
      try {
        setIsLoading(true)
        
        // Use direct Supabase client like the work page instead of API route
        const { data, error: supabaseError } = await supabaseClient
          .from('projects')
          .select(`
            *,
            project_images (*),
            tools:project_tools (
              tool:tools (*)
            ),
            tags:project_tags (
              tag:tags (*)
            )
          `)
          .order('featured', { ascending: true, nullsFirst: false })
          .order('created_at', { ascending: false });
          
        if (supabaseError) {
          throw supabaseError;
        }
        
        if (!data) {
          setProjects([]);
          return;
        }
        
        // Transform the data to match the Project type
        const transformedProjects = data.map((project: any) => ({
          ...project,
          tools: project.tools?.map((pt: any) => pt.tool).filter(Boolean) || [],
          tags: project.tags?.map((pt: any) => pt.tag).filter(Boolean) || []
        }));
        
        setProjects(transformedProjects);
      } catch (err) {
        console.error("Error fetching projects:", err)
        setError(err instanceof Error ? err : new Error("An unknown error occurred"))
      } finally {
        setIsLoading(false)
      }
    }

    fetchProjects()
  }, [])

  return { projects, isLoading, error }
}

