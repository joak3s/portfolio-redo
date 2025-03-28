"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, X, ArrowLeft } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { supabaseClient } from "@/lib/supabase-browser"

export default function CreateJourneyMilestonePage() {
  const [title, setTitle] = useState("")
  const [year, setYear] = useState("")
  const [description, setDescription] = useState("")
  const [skills, setSkills] = useState<string[]>([])
  const [currentSkill, setCurrentSkill] = useState("")
  const [icon, setIcon] = useState("image")
  const [color, setColor] = useState("bg-blue-500/10 dark:bg-blue-500/20")
  const [image, setImage] = useState("")
  const [order, setOrder] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleAddSkill = () => {
    if (currentSkill.trim() && !skills.includes(currentSkill.trim())) {
      setSkills([...skills, currentSkill.trim()])
      setCurrentSkill("")
    }
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title || !year || !description || skills.length === 0 || !icon || !color || !image) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill out all required fields."
      })
      return
    }

    try {
      setIsSubmitting(true)
      
      const { data, error } = await supabaseClient
        .from("journey_milestones")
        .insert({
          title,
          year,
          description,
          skills,
          icon,
          color,
          image,
          order
        })
        .select()
        .single()
      
      if (error) throw new Error(error.message)
      
      toast({
        title: "Success",
        description: "Journey milestone created successfully."
      })
      
      router.push("/admin/journey")
    } catch (err) {
      console.error("Error creating journey milestone:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create journey milestone."
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container py-10">
      <Button 
        variant="outline" 
        className="mb-6 flex items-center gap-2"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>
      
      <Card>
        <CardHeader>
          <CardTitle>Create Journey Milestone</CardTitle>
          <CardDescription>Add a new milestone to your professional journey.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., First Graphic Design Project"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Year *</Label>
                  <Input
                    id="year"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="e.g., 2010"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe this milestone and its significance..."
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Skills *</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={currentSkill}
                    onChange={(e) => setCurrentSkill(e.target.value)}
                    placeholder="e.g., Photoshop"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddSkill()
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddSkill}>Add</Button>
                </div>
                {skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="ml-1 rounded-full hover:bg-muted p-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No skills added yet.</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="icon">Icon *</Label>
                  <select
                    id="icon"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="image">Image</option>
                    <option value="code">Code</option>
                    <option value="layout">Layout</option>
                    <option value="briefcase">Briefcase</option>
                    <option value="message-square">Message Square</option>
                    <option value="tool">Tool</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color *</Label>
                  <select
                    id="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="bg-blue-500/10 dark:bg-blue-500/20">Blue</option>
                    <option value="bg-green-500/10 dark:bg-green-500/20">Green</option>
                    <option value="bg-purple-500/10 dark:bg-purple-500/20">Purple</option>
                    <option value="bg-orange-500/10 dark:bg-orange-500/20">Orange</option>
                    <option value="bg-pink-500/10 dark:bg-pink-500/20">Pink</option>
                    <option value="bg-red-500/10 dark:bg-red-500/20">Red</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Image URL *</Label>
                <Input
                  id="image"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="e.g., https://example.com/image.jpg or /images/journey/image.jpg"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Enter a URL to your image. You can upload images via Supabase Storage or use a public URL.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="order">Order</Label>
                <Input
                  id="order"
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
                  placeholder="Display order (lower numbers appear first)"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Milestone
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 