"use client"

import Link from "next/link"
import { Pencil } from "lucide-react"
import type { Diet, Goal, MacroTargets } from "@/lib/types"
import { GOAL_OPTIONS } from "@/components/settings/PreferencesFields"
import { Button } from "@/components/ui/button"

const goalLabel = (goal: Goal) => GOAL_OPTIONS.find((g) => g.value === goal)?.label ?? goal
const prettyDiet = (d: string) => d.charAt(0).toUpperCase() + d.slice(1)

/**
 * Compact, read-only summary of the user's saved goal and targets for Home.
 * Settings is the source of truth — this only links there to edit.
 */
export default function GoalSummary({
  goal,
  targets,
  diets,
  avoid,
  note,
}: {
  goal: Goal
  targets: MacroTargets
  diets: Diet[]
  avoid: string[]
  note: string
}) {
  const rows: { label: string; value: string }[] = [
    { label: "Goal", value: goalLabel(goal) },
    { label: "Daily target", value: `${targets.calories.toLocaleString()} kcal` },
    { label: "Macros", value: `${targets.protein}g protein · ${targets.carbs}g carbs · ${targets.fat}g fat` },
    { label: "Diet", value: diets.length ? diets.map(prettyDiet).join(", ") : "No restrictions" },
  ]
  if (avoid.length) rows.push({ label: "Avoiding", value: avoid.join(", ") })

  return (
    <div className="space-y-4">
      <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
        {rows.map((r) => (
          <div key={r.label} className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{r.label}</span>
            <span className="text-sm font-medium">{r.value}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
        <p className="text-xs text-muted-foreground">{note}.</p>
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <Link href="/settings">
            <Pencil className="h-3.5 w-3.5" />
            Edit in Settings
          </Link>
        </Button>
      </div>
    </div>
  )
}
