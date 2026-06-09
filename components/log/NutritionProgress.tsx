import type { MacroTargets, MacroTotals } from "@/lib/types"
import { cn } from "@/lib/utils"

const ROWS: { key: keyof MacroTotals; label: string; unit: string; color: string }[] = [
  { key: "calories", label: "Calories", unit: "kcal", color: "bg-primary" },
  { key: "protein", label: "Protein", unit: "g", color: "bg-emerald-500" },
  { key: "carbs", label: "Carbs", unit: "g", color: "bg-amber-500" },
  { key: "fat", label: "Fat", unit: "g", color: "bg-sky-500" },
]

/** Four progress rows: logged totals vs daily targets. Bar clamps at 100%; % can exceed. */
export default function NutritionProgress({ totals, targets }: { totals: MacroTotals; targets: MacroTargets }) {
  return (
    <div className="space-y-3">
      {ROWS.map((row) => {
        const current = totals[row.key]
        const target = targets[row.key]
        const pct = target > 0 ? (current / target) * 100 : 0
        const over = pct > 100
        return (
          <div key={row.key} className="space-y-1">
            <div className="flex items-baseline justify-between gap-2 text-xs">
              <span className="font-medium">{row.label}</span>
              <span
                className={cn(
                  "tabular-nums text-muted-foreground",
                  over && "font-medium text-amber-600 dark:text-amber-500",
                )}
              >
                {Math.round(current).toLocaleString()} / {Math.round(target).toLocaleString()} {row.unit} ·{" "}
                {Math.round(pct)}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full transition-all", row.color)}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
