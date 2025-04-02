"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, Edit, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { supabaseClient } from "@/lib/supabase-browser"
import type { JourneyMilestone } from "@/lib/types/journey"

export default function AdminJourneyPage() {
  const [milestones, setMilestones] = useState<JourneyMilestone[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  // Fetch journey milestones
  useEffect(() => {
    fetchMilestones()
  }, [])

  const fetchMilestones = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabaseClient
        .from("journey_milestones")
        .select("*")
        .order("display_order", { ascending: true })

      if (fetchError) throw new Error(fetchError.message)

      setMilestones(data || [])
    } catch (err) {
      console.error("Error fetching journey milestones:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch milestones")
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch journey milestones."
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this milestone?")) return

    try {
      const { error } = await supabaseClient
        .from("journey_milestones")
        .delete()
        .eq("id", id)

      if (error) throw new Error(error.message)

      toast({
        title: "Success",
        description: "Milestone deleted successfully."
      })

      // Refresh the milestone list
      fetchMilestones()
    } catch (err) {
      console.error("Error deleting milestone:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete milestone."
      })
    }
  }

  const handleEdit = (id: string) => {
    router.push(`/admin/journey/edit/${id}`)
  }

  const handleCreate = () => {
    router.push("/admin/journey/create")
  }

  if (isLoading) {
    return (
      <div className="container py-10 flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Loading journey milestones...</p>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Journey Milestones</h1>
          <p className="text-muted-foreground">Manage your professional journey milestones.</p>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Milestone
        </Button>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Narrative Arc Structure Guide</CardTitle>
          <CardDescription>
            Create a compelling professional journey with these suggested milestones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-2">Recommended Milestones Structure</h3>
                <div className="space-y-4 text-sm">
                  <div>
                    <p><strong>1. Beginning (2015):</strong> First Graphic Design Commission</p>
                    <p className="text-muted-foreground text-xs mt-1">Shows your origins in graphic design, establishes your foundation in visual communication, and emphasizes client work experience from the start.</p>
                  </div>
                  <div>
                    <p><strong>2. Educational Foundation (2018):</strong> UC Santa Cruz</p>
                    <p className="text-muted-foreground text-xs mt-1">Highlights your academic credentials, explains the theoretical underpinning of your approach, and links cognitive science to your user-centered design philosophy.</p>
                  </div>
                  <div>
                    <p><strong>3. Transition Point (2020):</strong> Precision Mercedes</p>
                    <p className="text-muted-foreground text-xs mt-1">Marks your pivot from pure graphic design to web experiences, showcases your first significant client presentation, and demonstrates growing technical skills.</p>
                  </div>
                  <div>
                    <p><strong>4. Skill Expansion (2021):</strong> Off The Leash Lifestyle</p>
                    <p className="text-muted-foreground text-xs mt-1">Shows diversification into e-commerce, highlights integration of social media with digital design, and demonstrates growing business acumen with conversion-focused design.</p>
                  </div>
                  <div>
                    <p><strong>5. Professional Growth (2022):</strong> Aletheia Digital Media</p>
                    <p className="text-muted-foreground text-xs mt-1">Career advancement into an agency role, leadership responsibilities and team management, and client portfolio expansion and project management skills.</p>
                  </div>
                  <div>
                    <p><strong>6. Technical Mastery (2023):</strong> Swyvvl Real Estate Platform</p>
                    <p className="text-muted-foreground text-xs mt-1">Full-stack development capabilities, complex project showcasing both design and technical expertise, and positions you as a complete product designer.</p>
                  </div>
                  <div>
                    <p><strong>7. Current Expertise (2024):</strong> AI Integration Specialist</p>
                    <p className="text-muted-foreground text-xs mt-1">Shows your cutting-edge skills in AI integration, demonstrates currency with latest technology trends, and represents the culmination of your journey.</p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-2">Why Use a Narrative Arc?</h3>
                <ul className="list-disc list-inside space-y-2 text-sm">
                  <li>Shows clear professional growth over time</li>
                  <li>Highlights your diverse skill acquisition</li>
                  <li>Creates a compelling story for visitors</li>
                  <li>Demonstrates your intentional career path</li>
                  <li>Makes your experience more memorable</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-8">
          <p>{error}</p>
        </div>
      )}

      {milestones.length === 0 && !isLoading ? (
        <Card className="mb-8">
          <CardContent className="pt-6 pb-6">
            <div className="text-center py-12">
              <p className="mb-6 text-muted-foreground">No journey milestones found.</p>
              <Button onClick={handleCreate}>Create Your First Milestone</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {milestones.map((milestone) => (
            <Card key={milestone.id} className="overflow-hidden">
              <div className="relative aspect-video bg-muted">
                {milestone.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={milestone.image}
                    alt={milestone.title}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-muted text-muted-foreground">
                    No image
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-2">
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={() => handleEdit(milestone.id)}
                    title="Edit milestone"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={() => handleDelete(milestone.id)}
                    title="Delete milestone"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{milestone.title}</CardTitle>
                    <CardDescription>{milestone.year}</CardDescription>
                  </div>
                  <Badge variant="outline">Order: {milestone.display_order}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-3">{milestone.description}</p>
                <div className="flex flex-wrap gap-2">
                  {milestone.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 