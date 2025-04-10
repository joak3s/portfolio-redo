import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  )
}

