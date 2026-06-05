"use client"

import { useCallback, useEffect, useState } from "react"
import { Sparkles, ArrowRight, Loader2, CheckCircle2, AlertCircle, RotateCw } from "lucide-react"
import { DINING_HALLS, getDiningHallById, formatMealPeriod } from "@/lib/dining-halls"
import type { Diet, Goal, MenuItem } from "@/lib/types"
import type { RecommendedPlate } from "@/lib/ai/plate-schema"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import TodaysPick from "@/components/recommend/TodaysPick"
import RecommendationGrid from "@/components/recommend/RecommendationGrid"
import RecommendationLoading from "@/components/recommend/RecommendationLoading"
import RecommendationError from "@/components/recommend/RecommendationError"

const GOAL_OPTIONS: { value: Goal; label: string }[] = [
  { value: "lose", label: "Lose weight" },
  { value: "maintain", label: "Maintain" },
  { value: "gain", label: "Gain weight" },
  { value: "protein", label: "Max protein" },
]

const DIET_OPTIONS: { value: Diet; label: string }[] = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "halal", label: "Halal" },
  { value: "gluten-free", label: "Gluten-free" },
]

/** Format today's date the way /api/menu expects: M/D/YYYY. */
function todayMenuDate(): string {
  const d = new Date()
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`
}

export default function HomePage() {
  // Selection
  const [hallId, setHallId] = useState<string>("")
  const [meal, setMeal] = useState<string>("")

  // Live menu
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [isMenuLoading, setIsMenuLoading] = useState(false)
  const [menuError, setMenuError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  // Preferences
  const [goal, setGoal] = useState<Goal>("maintain")
  const [diets, setDiets] = useState<Diet[]>([])
  const [avoid, setAvoid] = useState<string>("")
  const [calorieTarget, setCalorieTarget] = useState<string>("")

  // Results
  const [plates, setPlates] = useState<RecommendedPlate[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hall = getDiningHallById(hallId)
  const menuReady = menuItems.length > 0
  const canSubmit = Boolean(hallId && meal && menuReady) && !isLoading && !isMenuLoading

  const handleHallChange = (value: string) => {
    setHallId(value)
    setMeal("")
  }

  const toggleDiet = (value: Diet) => {
    setDiets((prev) => (prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value]))
  }

  // Load the live menu whenever a hall + meal are both selected (or on retry).
  useEffect(() => {
    const selectedHall = getDiningHallById(hallId)
    if (!selectedHall || !meal) {
      setMenuItems([])
      setMenuError(null)
      return
    }

    let ignore = false
    const controller = new AbortController()

    setIsMenuLoading(true)
    setMenuError(null)
    setMenuItems([])
    setPlates(null)
    setError(null)

    fetch("/api/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ diningHall: selectedHall.name, date: todayMenuDate(), mealPeriod: meal }),
      signal: controller.signal,
    })
      .then(async (res) => {
        const data = (await res.json()) as { menuItems?: MenuItem[]; error?: string }
        if (!res.ok) throw new Error(data.error || "Failed to load the menu.")
        return data
      })
      .then((data) => {
        if (!ignore) setMenuItems(data.menuItems ?? [])
      })
      .catch((err: unknown) => {
        if (ignore || (err instanceof DOMException && err.name === "AbortError")) return
        setMenuError(err instanceof Error ? err.message : "Failed to load the menu.")
      })
      .finally(() => {
        if (!ignore) setIsMenuLoading(false)
      })

    return () => {
      ignore = true
      controller.abort()
    }
  }, [hallId, meal, reloadKey])

  const reloadMenu = useCallback(() => setReloadKey((k) => k + 1), [])

  const getRecommendations = async () => {
    if (!hallId || !meal || !menuReady) return
    setIsLoading(true)
    setError(null)
    setPlates(null)

    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hall: hallId,
          meal,
          menuItems,
          userPrefs: {
            goal,
            diets,
            avoid: avoid
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
            calorieTarget: calorieTarget ? Number(calorieTarget) : undefined,
          },
        }),
      })

      const data = (await res.json()) as { plates?: RecommendedPlate[]; error?: string }
      if (!res.ok) throw new Error(data.error || "Something went wrong generating recommendations.")
      setPlates(data.plates ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const showMenuStatus = Boolean(hallId && meal)

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="space-y-3 text-center">
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="h-3.5 w-3.5" />
          AI Dining Concierge
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">What should you eat at Rutgers today?</h1>
        <p className="mx-auto max-w-xl text-muted-foreground">
          Pick a dining hall and meal, set your goals, and get AI-recommended plates with macros — built from
          today&apos;s live menu.
        </p>
      </section>

      {/* Selector + preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Find your plate</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Hall + meal */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Dining hall</Label>
              <Select value={hallId} onValueChange={handleHallChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a dining hall" />
                </SelectTrigger>
                <SelectContent>
                  {DINING_HALLS.map((h) => (
                    <SelectItem key={h.id} value={h.id}>
                      {h.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Meal</Label>
              <Select value={meal} onValueChange={setMeal} disabled={!hall}>
                <SelectTrigger>
                  <SelectValue placeholder={hall ? "Select a meal" : "Pick a hall first"} />
                </SelectTrigger>
                <SelectContent>
                  {hall?.mealPeriods.map((period) => (
                    <SelectItem key={period} value={period}>
                      {formatMealPeriod(period)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Live menu status */}
          {showMenuStatus && (
            <div className="text-sm">
              {isMenuLoading && (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Loading today&apos;s menu…
                </span>
              )}
              {!isMenuLoading && menuError && (
                <span className="flex flex-wrap items-center gap-1.5 text-destructive">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Couldn&apos;t load the menu: {menuError}
                  <button onClick={reloadMenu} className="inline-flex items-center gap-1 underline">
                    <RotateCw className="h-3 w-3" /> Retry
                  </button>
                </span>
              )}
              {!isMenuLoading && !menuError && menuReady && (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                  Loaded {menuItems.length} live menu items from {hall?.name} · {formatMealPeriod(meal)}
                </span>
              )}
              {!isMenuLoading && !menuError && !menuReady && (
                <span className="flex flex-wrap items-center gap-1.5 text-muted-foreground">
                  No items found — this meal may not be served right now.
                  <button onClick={reloadMenu} className="inline-flex items-center gap-1 underline">
                    <RotateCw className="h-3 w-3" /> Retry
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Goal */}
          <div className="space-y-1.5">
            <Label>Goal</Label>
            <Select value={goal} onValueChange={(v) => setGoal(v as Goal)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GOAL_OPTIONS.map((g) => (
                  <SelectItem key={g.value} value={g.value}>
                    {g.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Diet chips */}
          <div className="space-y-1.5">
            <Label>Dietary restrictions</Label>
            <div className="flex flex-wrap gap-2">
              {DIET_OPTIONS.map((d) => {
                const active = diets.includes(d.value)
                return (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => toggleDiet(d.value)}
                    aria-pressed={active}
                    className={cn(
                      "rounded-full border px-3 py-1 text-sm transition-colors",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input bg-background hover:bg-muted",
                    )}
                  >
                    {d.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Avoid + calorie target */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="avoid">Foods to avoid</Label>
              <Input
                id="avoid"
                placeholder="e.g. mushrooms, shellfish"
                value={avoid}
                onChange={(e) => setAvoid(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="calorieTarget">Calorie target (optional)</Label>
              <Input
                id="calorieTarget"
                type="number"
                placeholder="e.g. 700"
                value={calorieTarget}
                onChange={(e) => setCalorieTarget(e.target.value)}
              />
            </div>
          </div>

          <Button className="w-full gap-2" disabled={!canSubmit} onClick={getRecommendations}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                Get Recommendations
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {isLoading && <RecommendationLoading />}

      {!isLoading && error && <RecommendationError message={error} onRetry={getRecommendations} />}

      {!isLoading && !error && plates && plates.length > 0 && (
        <div className="space-y-8">
          <TodaysPick plate={plates[0]} />
          <RecommendationGrid plates={plates.slice(1)} />
        </div>
      )}

      {!isLoading && !error && !plates && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-lg font-semibold">Today&apos;s Pick</h2>
            <Badge variant="outline" className="text-[10px]">
              Preview
            </Badge>
          </div>
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <p className="font-medium">Your recommendations will appear here</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Choose a hall and meal to load today&apos;s menu, set your goal, then hit Get Recommendations to see
                three AI-built plates with macros.
              </p>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  )
}
