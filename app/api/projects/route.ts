import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Define types for project and related data
interface Tag {
  id: string;
  name: string;
  slug: string;
  created_at: Date;
  updated_at: Date | null;
}

interface Tool {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  created_at: Date;
  updated_at: Date | null;
}

interface ProjectTag {
  tag: Tag;
}

interface ProjectTool {
  tool: Tool;
}

interface ProjectWithRelations {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  summary: string | null;
  featured: boolean;
  status: string;
  created_at: Date;
  updated_at: Date | null;
  images: {
    id: string;
    url: string;
    alt_text: string | null;
    order_index: number;
    project_id: string;
    created_at: Date;
    updated_at: Date | null;
  }[];
  tags: ProjectTag[];
  tools: ProjectTool[];
}

// GET /api/projects - Get all projects (or featured projects if filtered)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const featured = searchParams.get('featured')
    
    const projects = await prisma.project.findMany({
      where: featured === 'true' ? { featured: true } : undefined,
      include: {
        images: {
          orderBy: {
            order_index: 'asc'
          }
        },
        tags: {
          include: {
            tag: true
          }
        },
        tools: {
          include: {
            tool: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    }) as ProjectWithRelations[]

    // Transform data to match the expected format for the frontend
    const formattedProjects = projects.map((project: ProjectWithRelations) => {
      return {
        ...project,
        tags: project.tags.map((pt: ProjectTag) => pt.tag),
        tools: project.tools.map((pt: ProjectTool) => pt.tool)
      }
    })

    return NextResponse.json(formattedProjects)
  } catch (error) {
    console.error('Error in GET /api/projects:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

