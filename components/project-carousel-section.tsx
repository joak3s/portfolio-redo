import { ProjectCarousel } from "@/components/project-carousel"
import type { Project } from "@/lib/types"

interface HomeCarouselSectionProps {
  projects: Project[]
}

export function HomeCarouselSection({ projects }: HomeCarouselSectionProps) {
  return (
    <section className="py-12 bg-muted/20">
      <div className="container">
        <h2 className="text-3xl font-bold mb-6">Featured Work</h2>
        <p className="text-muted-foreground mb-8 max-w-2xl">
          Browse through a selection of my recent projects. Each project showcases my skills in UX design and AI
          development.
        </p>

        <ProjectCarousel projects={projects} />
      </div>
    </section>
  )
}

