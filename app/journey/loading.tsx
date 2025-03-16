import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container py-12">
      <Skeleton className="h-12 w-64 mb-4" />
      <Skeleton className="h-6 w-full max-w-2xl mb-12" />

      <div className="h-1 w-full bg-muted/50 my-16 relative">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton
            key={i}
            className="absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full"
            style={{ left: `${(i / 4) * 100}%` }}
          />
        ))}
      </div>

      <Skeleton className="h-[400px] w-full mt-24 rounded-lg" />

      <div className="flex justify-between mt-8">
        <Skeleton className="h-10 w-28" />
        <div className="flex gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-2 w-2 rounded-full" />
          ))}
        </div>
        <Skeleton className="h-10 w-28" />
      </div>
    </div>
  )
}

