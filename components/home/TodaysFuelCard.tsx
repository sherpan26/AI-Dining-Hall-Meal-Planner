import Link from "next/link"
import { Flame, ArrowRight } from "lucide-react"
import type { LoggedMeal, MacroTargets, MacroTotals } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import NutritionProgress from "@/components/log/NutritionProgress"

/**
 * Sidebar card showing today's logged nutrition vs targets.
 * Presentational — the parent owns the `useLoggedMeals` state so logging on the
 * same page updates this card immediately.
 */
export default function TodaysFuelCard({
  totals,
  meals,
  targets,
  note,
}: {
  totals: MacroTotals
  meals: LoggedMeal[]
  targets: MacroTargets
  note: string
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Flame className="h-4 w-4 text-primary" />
          Today&apos;s Fuel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground">{note}</p>
          <p className="text-sm font-medium">
            Logged today: <span className="tabular-nums">{Math.round(totals.calories).toLocaleString()}</span> /{" "}
            <span className="tabular-nums">{targets.calories.toLocaleString()}</span> kcal
          </p>
        </div>

        <NutritionProgress totals={totals} targets={targets} />

        <div className="space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Today&apos;s meals</p>
          {meals.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No meals logged yet. Log a recommended plate to start tracking today.
            </p>
          ) : (
            <ul className="space-y-0.5 text-sm">
              {meals.slice(0, 4).map((m) => (
                <li key={m.id} className="truncate">
                  • {m.title}
                </li>
              ))}
              {meals.length > 4 && (
                <li className="text-xs text-muted-foreground">+{meals.length - 4} more</li>
              )}
            </ul>
          )}
        </div>

        <Button asChild variant="outline" size="sm" className="w-full gap-1">
          <Link href="/log">
            View daily log
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
