"use client"

import { cn } from "@/lib/utils"

/** Status dot color from how close the day's calories are to target. */
function statusDot(pct: number): string {
  if (pct > 110) return "bg-amber-500" // over target
  if (pct >= 70) return "bg-emerald-500" // near / at target
  return "bg-sky-500" // logged but light
}

interface CalendarDayProps {
  date: Date
  dateKey: string
  /** Whether this day belongs to the month currently in view. */
  inMonth: boolean
  isToday: boolean
  isSelected: boolean
  mealCount: number
  /** Calories as a % of target, or null when no meals were logged. */
  caloriePct: number | null
  onSelect: (dateKey: string) => void
}

/** One day cell in the month calendar — a button, not a table cell. */
export default function CalendarDay({
  date,
  dateKey,
  inMonth,
  isToday,
  isSelected,
  mealCount,
  caloriePct,
  onSelect,
}: CalendarDayProps) {
  const hasMeals = mealCount > 0
  const pct = caloriePct ?? 0
  const fullLabel = date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })

  return (
    <button
      type="button"
      onClick={() => onSelect(dateKey)}
      aria-pressed={isSelected}
      aria-label={`${fullLabel}${hasMeals ? `, ${mealCount} meal${mealCount === 1 ? "" : "s"} logged` : ", no meals logged"}`}
      className={cn(
        "flex min-h-[3.75rem] flex-col items-start gap-0.5 rounded-lg border p-1.5 text-left transition-colors sm:min-h-[4.5rem] sm:p-2",
        "hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
        isSelected
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : isToday
            ? "border-primary/40"
            : "border-border",
        !inMonth && "opacity-40",
      )}
    >
      <span
        className={cn(
          "text-xs font-medium tabular-nums",
          isSelected || isToday ? "text-primary" : "text-foreground",
        )}
      >
        {date.getDate()}
      </span>

      {hasMeals ? (
        <span className="mt-auto w-full space-y-0.5">
          <span className="hidden text-[10px] leading-tight text-muted-foreground sm:block">
            {mealCount} meal{mealCount === 1 ? "" : "s"}
          </span>
          <span className="flex items-center gap-1 text-[10px] leading-tight text-muted-foreground">
            <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", statusDot(pct))} />
            <span className="tabular-nums">{Math.round(pct)}%</span>
          </span>
        </span>
      ) : isToday && !isSelected ? (
        <span className="mt-auto text-[10px] font-medium leading-tight text-primary/70">Today</span>
      ) : null}
    </button>
  )
}
