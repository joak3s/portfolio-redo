import { Skeleton } from "@/components/ui/skeleton"

export default function WorkLoading() {
  return (
    <div className="container py-10">
      <div className="space-y-4 mb-8">
        <Skeleton className="h-12 w-[250px]" />
        <Skeleton className="h-6 w-[450px]" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="aspect-[3/4] w-full rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
            <div className="flex gap-2">
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="h-6 w-16" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

