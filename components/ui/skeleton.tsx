import { cn } from "@/lib/utils"

/**
 * Skeleton component for loading states
 * @component
 * @example
 * ```tsx
 * <Skeleton className="h-4 w-[200px]" />
 * ```
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
