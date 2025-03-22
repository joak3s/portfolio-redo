import { getProjectBySlug } from "@/lib/cms"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default async function ProjectDetailPage({
  params,
}: {
  params: { slug: string }
}) {
  const project = await getProjectBySlug(params.slug)

  if (!project) {
    notFound()
  }

  return (
    <div className="container py-12">
      <div className="mb-8">
        <Link href="/featured">
          <Button variant="ghost" className="group pl-0">
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Featured Work
          </Button>
        </Link>
      </div>

      <div className="space-y-12 max-w-4xl mx-auto">
        <div>
          <h1 className="text-4xl font-bold mb-4">{project.name}</h1>
          <p className="text-xl text-muted-foreground">{project.short_summary}</p>
        </div>

        <div className="relative aspect-video w-full overflow-hidden rounded-lg">
          <Image
            src={project.main_image || "/placeholder.svg"}
            alt={project.name}
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {project.tools.map((tool) => (
            <Badge key={tool} variant="secondary">
              {tool}
            </Badge>
          ))}
        </div>

        {project.website_link && (
          <div>
            <Link href={project.website_link} target="_blank" rel="noopener noreferrer">
              <Button className="group">
                Visit Website
                <ExternalLink className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Challenge</h2>
            <p className="text-muted-foreground">{project.challenge}</p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Approach</h2>
            <p className="text-muted-foreground">{project.approach}</p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Solution</h2>
          <p className="text-muted-foreground">{project.solution}</p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Results</h2>
          <p className="text-muted-foreground">{project.results}</p>
        </div>
      </div>
    </div>
  )
}

