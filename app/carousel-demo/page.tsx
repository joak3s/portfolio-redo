import { ProjectCarousel } from "@/components/project-carousel"

async function getProjects() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/projects`, {
    next: { revalidate: 3600 } // Revalidate every hour
  })

  if (!res.ok) {
    return []
  }

  return res.json()
}

export default async function CarouselDemoPage() {
  const projects = await getProjects()

  return (
    <div className="container py-12">
      <h1 className="text-4xl font-bold mb-8">Featured Projects</h1>

      <div className="mb-12">
        <ProjectCarousel projects={projects.slice(0, 5)} />
      </div>

      <div className="bg-background/80 backdrop-blur-sm p-6 rounded-lg border shadow-sm">
        <h2 className="text-2xl font-semibold mb-4">About This Carousel</h2>
        <p className="mb-4">
          This carousel showcases projects from your portfolio with automatic scrolling. It's fully accessible with
          keyboard navigation (try using arrow keys) and screen reader support.
        </p>
        <p>
          The carousel is responsive and adapts to different screen sizes. It also pauses automatic scrolling when you
          interact with it, giving you time to explore each project.
        </p>
      </div>
    </div>
  )
}

