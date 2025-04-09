import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@supabase/supabase-js'

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

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Enable edge runtime for better performance
export const runtime = 'edge'

/**
 * GET endpoint to retrieve all projects
 * @param request - The incoming request
 * @returns List of projects with basic info (id, title, slug)
 */
export async function GET(request: Request) {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('id, title, slug, featured')
      .order('featured', { ascending: false })
      .order('title', { ascending: true })
    
    if (error) {
      console.error('Error fetching projects:', error)
      return NextResponse.json(
        { error: 'Failed to fetch projects' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      projects: data || [],
      count: data?.length || 0
    })
  } catch (error: any) {
    console.error('Error in projects lookup:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

