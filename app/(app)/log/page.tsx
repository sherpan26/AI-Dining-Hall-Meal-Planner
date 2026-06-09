"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { usePrefs, useLoggedMeals } from "@/lib/store"
import { estimateTargets, targetSourceNote } from "@/lib/nutrition/targets"
import { getLocalDateKey, isToday } from "@/lib/date"
import { Card, CardContent } from "@/components/ui/card"
import MealCalendar, { type DaySummary } from "@/components/log/MealCalendar"
import SelectedDayPanel from "@/components/log/SelectedDayPanel"
import RecentDays from "@/components/log/RecentDays"

export default function LogPage() {
  // Gate on mount so the calendar/today never render with build-time dates
  // (avoids SSR/CSR hydration mismatches; logged meals also hydrate client-side).
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const { prefs } = usePrefs()
  const targets = estimateTargets(prefs.goal, prefs.profile, prefs.calorieTarget)
  const note = targetSourceNote(targets, prefs.profile)

  const {
    removeLoggedMeal,
    clearLoggedMealsForDate,
    getMealsForDate,
    getTotalsForDate,
    getMealCountForDate,
    getDatesWithMeals,
  } = useLoggedMeals()

  const [selectedDate, setSelectedDate] = useState<string>(() => getLocalDateKey())

  const selectedMeals = getMealsForDate(selectedDate)
  const selectedTotals = getTotalsForDate(selectedDate)
  const recentDays = getDatesWithMeals().slice(0, 8)

  // Per-day summary for calendar cells: meal count + calories as % of target.
  const getDaySummary = useCallback(
    (dateKey: string): DaySummary | null => {
      const mealCount = getMealCountForDate(dateKey)
      if (mealCount === 0) return null
      const calories = getTotalsForDate(dateKey).calories
      const caloriePct = targets.calories > 0 ? (calories / targets.calories) * 100 : 0
      return { mealCount, caloriePct }
    },
    [getMealCountForDate, getTotalsForDate, targets.calories],
  )

  const handleRemove = (id: string) => {
    removeLoggedMeal(id)
    toast("Removed from your log")
  }

  const handleClearDay = () => {
    clearLoggedMealsForDate(selectedDate)
    toast(isToday(selectedDate) ? "Cleared today's log" : "Cleared this day's log")
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Rutgers–New Brunswick</p>
        <h1 className="text-2xl font-bold tracking-tight">Daily Log</h1>
        <p className="text-muted-foreground">Track what you actually ate from Rutgers dining halls.</p>
      </div>

      {!mounted ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">Loading your log…</CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Calendar + quick day jumps */}
          <div className="space-y-4">
            <MealCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} getDaySummary={getDaySummary} />
            <RecentDays
              dates={recentDays}
              selectedDate={selectedDate}
              onSelect={setSelectedDate}
              getMealCountForDate={getMealCountForDate}
            />
          </div>

          {/* Selected day detail */}
          <SelectedDayPanel
            dateKey={selectedDate}
            meals={selectedMeals}
            totals={selectedTotals}
            targets={targets}
            note={note}
            onRemoveMeal={handleRemove}
            onClearDay={handleClearDay}
          />
        </div>
      )}
    </div>
  )
}
