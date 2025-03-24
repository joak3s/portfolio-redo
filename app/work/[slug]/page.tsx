import { use } from 'react'
import { ProjectContent } from '@/components/project-content'

export default function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  return <ProjectContent slug={slug} />
} 