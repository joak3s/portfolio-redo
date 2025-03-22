import { getFeaturedProjects } from "@/lib/cms"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ProjectCarousel } from "@/components/project-carousel"

export default async function FeaturedPage() {
  const featuredProjects = await getFeaturedProjects()

  return (
    <div className="container py-12">
      <h1 className="text-4xl font-bold mb-4">Featured Work</h1>
      <p className="text-muted-foreground mb-8 max-w-2xl">
        Browse through a selection of my featured projects that showcase my expertise in UX design and AI development.
      </p>

      <div className="mb-12">
        <ProjectCarousel projects={featuredProjects.slice(0, 5)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mt-16">
        {featuredProjects.map((project, index) => {
          // Determine grid span based on index for asymmetrical layout
          const spanClasses = [
            "md:col-span-12", // First project spans full width
            "md:col-span-7", // Second project spans 7 columns
            "md:col-span-5", // Third project spans 5 columns
            "md:col-span-6", // Fourth project spans 6 columns
            "md:col-span-6", // Fifth project spans 6 columns
            "md:col-span-12", // Sixth project spans full width
          ][index % 6]

          return (
            <div key={project.id} className={`${spanClasses} group`}>
              <Link href={`/featured/${project.slug}`} className="block h-full">
                <div className="relative overflow-hidden rounded-lg aspect-video mb-4 group-hover:shadow-xl transition-all duration-300">
                  <Image
                    src={project.main_image || "/placeholder.svg"}
                    alt={project.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                <h2 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors duration-300">
                  {project.name}
                </h2>

                <p className="text-muted-foreground mb-4 line-clamp-2">{project.short_summary}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {project.tools.map((tool) => (
                    <Badge key={tool} variant="secondary" className="text-xs">
                      {tool}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center text-sm font-medium">
                  View Case Study
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}

