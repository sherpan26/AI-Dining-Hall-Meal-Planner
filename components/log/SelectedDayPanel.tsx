"use client"

import Link from "next/link"
import { CalendarOff, Trash2 } from "lucide-react"
import type { LoggedMeal, MacroTargets, MacroTotals } from "@/lib/types"
import { formatDateLabel, isToday } from "@/lib/date"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import NutritionProgress from "@/components/log/NutritionProgress"
import LoggedMealCard from "@/components/log/LoggedMealCard"

interface SelectedDayPanelProps {
  dateKey: string
  meals: LoggedMeal[]
  totals: MacroTotals
  targets: MacroTargets
  /** Short note on where the targets came from, e.g. "From your goal". */
  note: string
  onRemoveMeal: (id: string) => void
  onEditMeal: (meal: LoggedMeal) => void
  onClearDay: () => void
}

/** Detail panel for one selected calendar day: summary, meals, and clear action. */
export default function SelectedDayPanel({
  dateKey,
  meals,
  totals,
  targets,
  note,
  onRemoveMeal,
  onEditMeal,
  onClearDay,
}: SelectedDayPanelProps) {
  const today = isToday(dateKey)
  const mealCount = meals.length

  return (
    <section className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-base">
              {formatDateLabel(dateKey)}
              {today && (
                <Badge className="bg-primary/10 text-primary hover:bg-primary/10" variant="secondary">
                  Today
                </Badge>
              )}
            </CardTitle>
            <span className="text-xs text-muted-foreground">
              {mealCount} meal{mealCount === 1 ? "" : "s"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{note}</p>
        </CardHeader>
        <CardContent>
          {mealCount === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
                <CalendarOff className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No meals logged for this day.</p>
              {today ? (
                <Button asChild size="sm" className="mt-1">
                  <Link href="/">Get recommendations</Link>
                </Button>
              ) : (
                <p className="max-w-xs text-xs text-muted-foreground">
                  Select another day, or log meals from your recommendations.
                </p>
              )}
            </div>
          ) : (
            <NutritionProgress totals={totals} targets={targets} />
          )}
        </CardContent>
      </Card>

      {mealCount > 0 && (
        <>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Meals</h3>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                  {today ? "Clear today" : "Clear day"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{today ? "Clear today's log?" : "Clear this day's log?"}</AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes all {mealCount} meal{mealCount === 1 ? "" : "s"} logged on {formatDateLabel(dateKey)}.
                    This can&apos;t be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onClearDay}>{today ? "Clear today" : "Clear day"}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="grid gap-3">
            {meals.map((m) => (
              <LoggedMealCard key={m.id} meal={m} onRemove={onRemoveMeal} onEdit={onEditMeal} />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
