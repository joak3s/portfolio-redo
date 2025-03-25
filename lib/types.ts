export interface ProjectImage {
  id: string
  project_id: string
  url: string
  alt_text?: string
  order_index: number
  created_at: string
}

export interface Tool {
  id: string
  name: string
  created_at: string
}

export interface Tag {
  id: string
  name: string
  created_at: string
}

export interface Project {
  id: string
  title: string
  description: string
  slug: string
  challenge?: string
  approach?: string
  solution?: string
  results?: string
  featured?: number
  status: 'draft' | 'published'
  website_url?: string
  priority?: number
  created_at: string
  updated_at: string
  // Relations
  project_images?: ProjectImage[]
  tools?: Tool[]
  tags?: Tag[]
}

export interface ProjectCreate extends Omit<Project, 'id' | 'created_at' | 'updated_at'> {
  images?: { url: string; alt_text?: string; order_index: number }[]
  tool_ids?: string[]
  tag_ids?: string[]
}

export interface ProjectUpdate extends Partial<Omit<Project, 'id' | 'created_at' | 'updated_at'>> {
  id: string
  images?: { url: string; alt_text?: string; order_index: number }[]
  tool_ids?: string[]
  tag_ids?: string[]
}

export interface ProjectToolRow {
  project_id: string
  tool_id: string
  created_at: string
}

export interface ProjectTagRow {
  project_id: string
  tag_id: string
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: Project
        Insert: Omit<Project, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Project, 'id' | 'created_at' | 'updated_at'>>
      }
      project_images: {
        Row: ProjectImage
        Insert: Omit<ProjectImage, 'id' | 'created_at'>
        Update: Partial<Omit<ProjectImage, 'id' | 'created_at'>>
      }
      tools: {
        Row: Tool
        Insert: Omit<Tool, 'id' | 'created_at'>
        Update: Partial<Omit<Tool, 'id' | 'created_at'>>
      }
      tags: {
        Row: Tag
        Insert: Omit<Tag, 'id' | 'created_at'>
        Update: Partial<Omit<Tag, 'id' | 'created_at'>>
      }
      project_tools: {
        Row: ProjectToolRow
        Insert: Omit<ProjectToolRow, 'created_at'>
        Update: Partial<Omit<ProjectToolRow, 'created_at'>>
      }
      project_tags: {
        Row: ProjectTagRow
        Insert: Omit<ProjectTagRow, 'created_at'>
        Update: Partial<Omit<ProjectTagRow, 'created_at'>>
      }
    }
  }
}

