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

  const handleManageImages = (id: string) => {
    router.push(`/admin/journey/${id}/images`)
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
                    variant="secondary"
                    onClick={() => handleManageImages(milestone.id)}
                    title="Manage images"
                  >
                    <img src="/images/gallery-icon.svg" alt="Gallery" className="h-4 w-4" />
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
                  <Badge variant="outline">Order: {milestone.order}</Badge>
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
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleManageImages(milestone.id)}
                >
                  Manage Images
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 