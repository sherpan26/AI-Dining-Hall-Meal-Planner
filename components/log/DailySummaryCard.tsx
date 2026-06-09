import type { MacroTargets, MacroTotals } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import NutritionProgress from "@/components/log/NutritionProgress"

/** A day's logged totals vs targets, with progress bars. */
export default function DailySummaryCard({
  title,
  subtitle,
  totals,
  targets,
  mealCount,
}: {
  title: string
  subtitle?: string
  totals: MacroTotals
  targets: MacroTargets
  mealCount: number
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-baseline justify-between gap-2 text-base">
          <span>{title}</span>
          <span className="text-xs font-normal text-muted-foreground">
            {mealCount} meal{mealCount === 1 ? "" : "s"}
          </span>
        </CardTitle>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </CardHeader>
      <CardContent>
        <NutritionProgress totals={totals} targets={targets} />
      </CardContent>
    </Card>
  )
}
