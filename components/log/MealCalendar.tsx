"use client"

import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  addMonths,
  getLocalDateKey,
  getMonthGridDays,
  getMonthLabel,
  getStartOfMonth,
  parseDateKey,
  sameMonth,
  WEEKDAY_LABELS,
} from "@/lib/date"
import CalendarDay from "@/components/log/CalendarDay"

/** Summary the page supplies for any date that has logged meals. */
export interface DaySummary {
  mealCount: number
  /** Calories logged that day as a % of the calorie target. */
  caloriePct: number
}

interface MealCalendarProps {
  selectedDate: string
  onSelectDate: (dateKey: string) => void
  /** Returns the day's summary, or null when nothing was logged that day. */
  getDaySummary: (dateKey: string) => DaySummary | null
}

/** Monthly calendar of logged meals with prev/next/today navigation. */
export default function MealCalendar({ selectedDate, onSelectDate, getDaySummary }: MealCalendarProps) {
  const [viewMonth, setViewMonth] = useState<Date>(() => getStartOfMonth(parseDateKey(selectedDate)))

  // Follow the selected date into its month (e.g. when a "recent day" chip in
  // another month is clicked, or the Today button is pressed).
  useEffect(() => {
    setViewMonth(getStartOfMonth(parseDateKey(selectedDate)))
  }, [selectedDate])

  const todayKey = getLocalDateKey()
  const days = getMonthGridDays(viewMonth)

  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        {/* Month header + controls */}
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold">{getMonthLabel(viewMonth)}</h2>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs" onClick={() => onSelectDate(todayKey)}>
              Today
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="Previous month"
              onClick={() => setViewMonth((m) => addMonths(m, -1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="Next month"
              onClick={() => setViewMonth((m) => addMonths(m, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Weekday labels */}
        <div className="mb-1 grid grid-cols-7 gap-1">
          {WEEKDAY_LABELS.map((w) => (
            <div
              key={w}
              className="py-1 text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
            >
              {w}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const key = getLocalDateKey(day)
            const summary = getDaySummary(key)
            return (
              <CalendarDay
                key={key}
                date={day}
                dateKey={key}
                inMonth={sameMonth(day, viewMonth)}
                isToday={key === todayKey}
                isSelected={key === selectedDate}
                mealCount={summary?.mealCount ?? 0}
                caloriePct={summary?.caloriePct ?? null}
                onSelect={onSelectDate}
              />
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
