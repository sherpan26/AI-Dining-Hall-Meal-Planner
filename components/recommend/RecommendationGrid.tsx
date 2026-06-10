import type { RecommendedPlate } from "@/lib/ai/plate-schema"
import type { RemainingTargets } from "@/lib/types"
import PlateCard from "@/components/recommend/PlateCard"

interface RecommendationGridProps {
  plates: RecommendedPlate[]
  /** Returns whether a given plate id is currently saved. */
  isSaved?: (id: string) => boolean
  onToggleSave?: (plate: RecommendedPlate) => void
  onLogMeal?: (plate: RecommendedPlate) => void
  remaining?: RemainingTargets
}

/** Renders the remaining (non-pick) plate recommendations in a grid. */
export default function RecommendationGrid({
  plates,
  isSaved,
  onToggleSave,
  onLogMeal,
  remaining,
}: RecommendationGridProps) {
  if (plates.length === 0) return null

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">More options</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {plates.map((plate) => (
          <PlateCard
            key={plate.id}
            plate={plate}
            saved={isSaved?.(plate.id)}
            onToggleSave={onToggleSave}
            onLogMeal={onLogMeal}
            remaining={remaining}
          />
        ))}
      </div>
    </section>
  )
}
