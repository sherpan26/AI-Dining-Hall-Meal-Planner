"use client"

import { CalendarRange, Lightbulb } from "lucide-react"
import type { LoggedMeal, MacroTargets, MacroTotals } from "@/lib/types"
import { getRecentDateKeys, parseDateKey } from "@/lib/date"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const EMPTY: MacroTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 }

interface DayBucket {
  key: string
  label: string
  totals: MacroTotals
  count: number
}

/** Most frequent value in a list, or null when empty. */
function mode(values: string[]): string | null {
  const counts = new Map<string, number>()
  let best: string | null = null
  let bestN = 0
  for (const v of values) {
    const n = (counts.get(v) ?? 0) + 1
    counts.set(v, n)
    if (n > bestN) {
      bestN = n
      best = v
    }
  }
  return best
}

/** Bar color by calories vs target — mirrors the calendar's day-status logic. */
function barColor(caloriePct: number): string {
  if (caloriePct > 110) return "bg-amber-500"
  if (caloriePct >= 70) return "bg-emerald-500"
  return "bg-sky-500"
}

interface WeeklyInsightsProps {
  loggedMeals: LoggedMeal[]
  targets: MacroTargets
  /** Highlight the column for this date key (scarlet accent). */
  selectedDate?: string
}

/** A practical 7-day summary of logged nutrition — no charts, no AI, no medical advice. */
export default function WeeklyInsights({ loggedMeals, targets, selectedDate }: WeeklyInsightsProps) {
  const weekKeys = getRecentDateKeys(7)
  const weekSet = new Set(weekKeys)
  const weekMeals = loggedMeals.filter((m) => weekSet.has(m.date))

  const days: DayBucket[] = weekKeys.map((key) => {
    const meals = loggedMeals.filter((m) => m.date === key)
    const totals = meals.reduce<MacroTotals>(
      (acc, m) => ({
        calories: acc.calories + m.totals.calories,
        protein: acc.protein + m.totals.protein,
        carbs: acc.carbs + m.totals.carbs,
        fat: acc.fat + m.totals.fat,
      }),
      { ...EMPTY },
    )
    return {
      key,
      label: parseDateKey(key).toLocaleDateString(undefined, { weekday: "short" }),
      totals,
      count: meals.length,
    }
  })

  const loggedDays = days.filter((d) => d.count > 0)
  const daysLogged = loggedDays.length

  // No logs in the last 7 days → simple invitation, no empty visuals.
  if (daysLogged === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarRange className="h-4 w-4 text-primary" />
            Weekly Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Start logging meals to unlock weekly insights.</p>
        </CardContent>
      </Card>
    )
  }

  const avgCalories = Math.round(loggedDays.reduce((s, d) => s + d.totals.calories, 0) / daysLogged)
  const avgProtein = Math.round(loggedDays.reduce((s, d) => s + d.totals.protein, 0) / daysLogged)
  const proteinHits = loggedDays.filter((d) => d.totals.protein >= targets.protein).length
  const bestProteinDay = loggedDays.reduce((best, d) => (d.totals.protein > best.totals.protein ? d : best))
  const topHall = mode(weekMeals.map((m) => m.hall))
  const topMeal = mode(weekMeals.map((m) => m.meal))

  const stats: { label: string; value: string }[] = [
    { label: "Avg calories / logged day", value: avgCalories.toLocaleString() },
    { label: "Avg protein / logged day", value: `${avgProtein}g` },
    { label: "Protein target hit", value: `${proteinHits}/7 days` },
    { label: "Days logged", value: `${daysLogged}/7 days` },
    { label: "Highest protein day", value: `${bestProteinDay.label} · ${Math.round(bestProteinDay.totals.protein)}g` },
  ]
  if (topHall) stats.push({ label: "Most logged hall", value: topHall })
  if (topMeal) stats.push({ label: "Most common meal", value: topMeal })

  // 1–3 plain-language insights derived from the data (no shaming).
  const insights: string[] = [`You logged meals on ${daysLogged} of the last 7 days.`]
  if (proteinHits > 0) {
    insights.push(`You hit your protein target ${proteinHits} ${proteinHits === 1 ? "time" : "times"} this week.`)
  }
  insights.push(`Your average protein is ${avgProtein}g per logged day.`)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarRange className="h-4 w-4 text-primary" />
          Weekly Insights
        </CardTitle>
        <p className="text-xs text-muted-foreground">Your last 7 days of logged meals.</p>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* 7-day visual */}
        <div className="grid grid-cols-7 gap-1.5">
          {days.map((d) => {
            const caloriePct = targets.calories > 0 ? (d.totals.calories / targets.calories) * 100 : 0
            const barPct = d.count > 0 ? Math.max(6, Math.min(100, caloriePct)) : 0
            const isSelected = d.key === selectedDate
            const tooltip =
              d.count > 0
                ? `${d.label}: ${Math.round(d.totals.calories)} kcal, ${Math.round(d.totals.protein)}g protein, ${d.count} meal${d.count === 1 ? "" : "s"}`
                : `${d.label}: No logs`
            return (
              <div key={d.key} className="flex flex-col items-center gap-1.5">
                <div
                  title={tooltip}
                  className={cn(
                    "flex h-20 w-full items-end overflow-hidden rounded-md bg-muted/50",
                    isSelected && "ring-2 ring-primary ring-offset-1",
                  )}
                >
                  {d.count > 0 && (
                    <div
                      className={cn("w-full rounded-md transition-all", barColor(caloriePct))}
                      style={{ height: `${barPct}%` }}
                    />
                  )}
                </div>
                <span className={cn("text-[10px] font-medium text-muted-foreground", isSelected && "text-primary")}>
                  {d.label}
                </span>
              </div>
            )
          })}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="space-y-0.5">
              <p className="text-sm font-semibold tabular-nums leading-tight">{s.value}</p>
              <p className="text-[11px] leading-tight text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Insights */}
        <ul className="space-y-1.5 rounded-lg bg-muted/40 p-3">
          {insights.slice(0, 3).map((line) => (
            <li key={line} className="flex items-start gap-2 text-sm text-muted-foreground">
              <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
