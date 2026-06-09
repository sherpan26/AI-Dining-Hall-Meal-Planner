"use client"

import Link from "next/link"
import { ClipboardList, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { usePrefs, useLoggedMeals } from "@/lib/store"
import { estimateTargets, targetSourceNote } from "@/lib/nutrition/targets"
import { getLocalDateKey, formatDateLabel } from "@/lib/date"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import DailySummaryCard from "@/components/log/DailySummaryCard"
import LoggedMealCard from "@/components/log/LoggedMealCard"

export default function LogPage() {
  const { prefs } = usePrefs()
  const targets = estimateTargets(prefs.goal, prefs.profile, prefs.calorieTarget)
  const note = targetSourceNote(targets, prefs.profile)

  const { loggedMeals, removeLoggedMeal, clearLoggedMealsForDate, getMealsForDate, getTotalsForDate } =
    useLoggedMeals()

  const todayKey = getLocalDateKey()
  const todayMeals = getMealsForDate(todayKey)
  const todayTotals = getTotalsForDate(todayKey)

  // Distinct dates with logged meals, excluding today, most recent first.
  const prevDates = Array.from(new Set(loggedMeals.map((m) => m.date)))
    .filter((d) => d !== todayKey)
    .sort()
    .reverse()

  const hasAny = loggedMeals.length > 0

  const handleRemove = (id: string) => {
    removeLoggedMeal(id)
    toast("Removed from your log")
  }

  const handleClearToday = () => {
    clearLoggedMealsForDate(todayKey)
    toast("Cleared today's log")
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Rutgers–New Brunswick</p>
        <h1 className="text-2xl font-bold tracking-tight">Daily Log</h1>
        <p className="text-muted-foreground">Track what you actually ate from Rutgers dining halls.</p>
      </div>

      {!hasAny ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <ClipboardList className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">You haven&apos;t logged any meals yet</p>
              <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                Generate a recommendation and tap &ldquo;Log meal&rdquo; to start tracking your daily nutrition.
              </p>
            </div>
            <Button asChild className="mt-1">
              <Link href="/">Get recommendations</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Today summary + meals */}
          <section className="space-y-4">
            <DailySummaryCard
              title="Today"
              subtitle={`${formatDateLabel(todayKey)} · ${note}`}
              totals={todayTotals}
              targets={targets}
              mealCount={todayMeals.length}
            />

            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Today&apos;s meals</h2>
              {todayMeals.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                      Clear today
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear today&apos;s log?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This removes all {todayMeals.length} meal{todayMeals.length === 1 ? "" : "s"} logged today. This
                        can&apos;t be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleClearToday}>Clear today</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>

            {todayMeals.length === 0 ? (
              <p className="text-sm text-muted-foreground">No meals logged today yet.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {todayMeals.map((m) => (
                  <LoggedMealCard key={m.id} meal={m} onRemove={handleRemove} />
                ))}
              </div>
            )}
          </section>

          {/* Previous days */}
          {prevDates.length > 0 && (
            <section className="space-y-6">
              <h2 className="text-lg font-semibold">Previous days</h2>
              {prevDates.map((date) => {
                const meals = getMealsForDate(date)
                const totals = getTotalsForDate(date)
                return (
                  <div key={date} className="space-y-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="font-semibold">{formatDateLabel(date)}</h3>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {meals.length} meal{meals.length === 1 ? "" : "s"} · {Math.round(totals.calories)} cal ·{" "}
                        {Math.round(totals.protein)}g P · {Math.round(totals.carbs)}g C · {Math.round(totals.fat)}g F
                      </span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {meals.map((m) => (
                        <LoggedMealCard key={m.id} meal={m} onRemove={handleRemove} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </section>
          )}
        </>
      )}
    </div>
  )
}
