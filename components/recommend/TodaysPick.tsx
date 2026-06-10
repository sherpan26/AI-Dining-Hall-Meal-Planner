import { Sparkles } from "lucide-react"
import type { RecommendedPlate } from "@/lib/ai/plate-schema"
import type { RemainingTargets } from "@/lib/types"
import PlateCard from "@/components/recommend/PlateCard"

interface TodaysPickProps {
  plate: RecommendedPlate
  saved?: boolean
  onToggleSave?: (plate: RecommendedPlate) => void
  onLogMeal?: (plate: RecommendedPlate) => void
  remaining?: RemainingTargets
}

/** Highlights the single best plate at the top of the results. */
export default function TodaysPick({ plate, saved, onToggleSave, onLogMeal, remaining }: TodaysPickProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="text-lg font-semibold">Today&apos;s Pick</h2>
      </div>
      <PlateCard
        plate={plate}
        highlight
        saved={saved}
        onToggleSave={onToggleSave}
        onLogMeal={onLogMeal}
        remaining={remaining}
      />
    </section>
  )
}
