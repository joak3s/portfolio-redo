import { ProjectContent } from '@/components/project-content'

export default function ProjectPage({ params }: { params: { slug: string } }) {
  return <ProjectContent slug={params.slug} />
} 