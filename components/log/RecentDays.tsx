"use client"

import { parseDateKey } from "@/lib/date"
import { cn } from "@/lib/utils"

interface RecentDaysProps {
  /** Date keys with logged meals, most recent first. */
  dates: string[]
  selectedDate: string
  onSelect: (dateKey: string) => void
  getMealCountForDate: (dateKey: string) => number
}

/** Compact "jump to a logged day" chip row, shown under the calendar. */
export default function RecentDays({ dates, selectedDate, onSelect, getMealCountForDate }: RecentDaysProps) {
  if (dates.length === 0) return null

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recent logged days</h3>
      <div className="flex flex-wrap gap-2">
        {dates.map((d) => {
          const label = parseDateKey(d).toLocaleDateString(undefined, { month: "short", day: "numeric" })
          const count = getMealCountForDate(d)
          const active = d === selectedDate
          return (
            <button
              key={d}
              type="button"
              onClick={() => onSelect(d)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs tabular-nums transition-colors",
                active
                  ? "border-primary bg-primary/10 font-medium text-primary"
                  : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              {label} · {count}
            </button>
          )
        })}
      </div>
    </div>
  )
}
