import { NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-admin"
import type { Project, Tool, Tag, ProjectImage } from "@/lib/types"

interface ProjectWithRelations extends Project {
  project_images: ProjectImage[]
  project_tools: {
    tool: Tool
  }[]
  project_tags: {
    tag: Tag
  }[]
}

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug
    
    if (!slug) {
      return NextResponse.json({ error: "Missing project slug" }, { status: 400 })
    }

    const supabaseAdmin = await getAdminClient()
    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .select(`
        *,
        project_images (*),
        project_tools (
          tool_id,
          tools (*)
        ),
        project_tags (
          tag_id,
          tags (*)
        )
      `)
      .eq('slug', slug)
      .single()

    if (error) {
      console.error("Error fetching project:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Transform the project data to match the expected format
    const formattedProject = {
      ...project,
      tools: project.project_tools.map((pt: any) => pt.tools),
      tags: project.project_tags.map((pt: any) => pt.tags),
      images: project.project_images
    }

    return NextResponse.json(formattedProject)
  } catch (error) {
    console.error("Error in project slug API:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 }
    )
  }
}

