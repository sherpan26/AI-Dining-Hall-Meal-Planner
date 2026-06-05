import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

function PlateSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
        <Skeleton className="h-8 w-full" />
      </CardContent>
    </Card>
  )
}

/** Loading placeholder shown while recommendations are generating. */
export default function RecommendationLoading() {
  return (
    <div className="space-y-6">
      <PlateSkeleton />
      <div className="grid gap-4 sm:grid-cols-2">
        <PlateSkeleton />
        <PlateSkeleton />
      </div>
    </div>
  )
}
