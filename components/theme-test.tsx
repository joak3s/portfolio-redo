"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"

export function ThemeTest() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <p>
          Current theme: <strong>{theme}</strong>
        </p>
        <div className="mt-2 flex gap-2">
          <div className="w-6 h-6 rounded bg-background border"></div>
          <div className="w-6 h-6 rounded bg-foreground"></div>
          <div className="w-6 h-6 rounded bg-primary"></div>
          <div className="w-6 h-6 rounded bg-secondary"></div>
          <div className="w-6 h-6 rounded bg-accent"></div>
          <div className="w-6 h-6 rounded bg-muted"></div>
        </div>
      </CardContent>
    </Card>
  )
}

