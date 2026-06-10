import { Target } from "lucide-react"
import type { RemainingTargets } from "@/lib/types"
import type { PlateNutrition } from "@/lib/ai/plate-schema"

/**
 * Small "fit for the rest of today" note under a plate's macros.
 * Computed entirely on the client from the plate's totals and the user's
 * remaining targets — no AI text required. Only rendered when meals have been
 * logged today (the parent passes `remaining` only then).
 */
export default function TodayFitNote({
  remaining,
  plate,
}: {
  remaining: RemainingTargets
  plate: PlateNutrition
}) {
  const calLeft = remaining.calories
  const afterProtein = Math.round(remaining.protein - plate.protein)

  let text: string
  if (calLeft <= 0) {
    // Already at/over the calorie goal — stay neutral, no shaming.
    text = `You're at today's calorie goal — this adds ~${Math.round(plate.calories)} kcal`
  } else {
    const pct = Math.round((plate.calories / calLeft) * 100)
    const proteinPart =
      afterProtein > 0 ? `${afterProtein}g protein to go` : "protein goal reached"
    text = `uses ~${pct}% of your remaining ${Math.round(calLeft)} kcal · ${proteinPart}`
  }

  return (
    <div className="flex items-start gap-1.5 rounded-md bg-primary/5 px-2.5 py-1.5 text-xs text-primary">
      <Target className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>
        <span className="font-medium">Today fit:</span> {text}
      </span>
    </div>
  )
}
