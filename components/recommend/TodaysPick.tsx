import { Sparkles } from "lucide-react"
import type { RecommendedPlate } from "@/lib/ai/plate-schema"
import PlateCard from "@/components/recommend/PlateCard"

/** Highlights the single best plate at the top of the results. */
export default function TodaysPick({ plate }: { plate: RecommendedPlate }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="text-lg font-semibold">Today&apos;s Pick</h2>
      </div>
      <PlateCard plate={plate} highlight />
    </section>
  )
}
