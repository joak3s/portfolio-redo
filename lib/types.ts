export interface ProjectImage {
  url: string
  alt: string
  caption?: string
}

export interface Project {
  id: string
  title: string
  description: string
  slug: string
  images: ProjectImage[]
  websiteUrl?: string
  featured?: number
  status: 'draft' | 'published'
  publishedAt?: string
  content?: {
    challenge?: string
    approach?: string
    solution?: string
    results?: string
  }
  tools?: string[]
  metadata?: {
    bgColor?: string
    mockupBgColor?: string
    priority?: number
  }
  createdAt: string
  updatedAt: string
  tags: string[]
}

export type ProjectWithoutContent = Omit<Project, 'content'>

export interface ProjectUpdate extends Partial<Project> {
  id: string
}

