export interface ProjectImage {
  
  url: string
  alt: string
  caption?: string
  isFeatured?: boolean
}

export interface Project {
  id: string
  title: string
  slug: string
  description: string
  content: {
    challenge: string
    approach: string
    solution: string
    results: string
  }
  featured: number
  publishedAt: string
  updatedAt?: string
  status: 'draft' | 'published'
  images: {
    thumbnail: ProjectImage
    gallery: ProjectImage[]
  }
  tags: string[]
  tools: string[]
  metadata: {
    seoTitle?: string
    seoDescription?: string
    priority: number
  }
  // Additional fields for admin interface
  websiteUrl?: string
}

export type ProjectWithoutContent = Omit<Project, 'content'>

export interface ProjectUpdate extends Partial<Project> {
  id: string
}

