"use client"

import { useState } from "react"
import { Sparkles, ArrowRight, Loader2 } from "lucide-react"
import { DINING_HALLS, getDiningHallById, formatMealPeriod } from "@/lib/dining-halls"
import type { Diet, Goal } from "@/lib/types"
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

// Step 4 uses a sample menu so the recommendation flow can be tested before live
// scraping is wired in. Replace with real menu data in a later step.
const MOCK_MENU_ITEMS = [
  { name: "Grilled Chicken Breast", category: "Grill", portion: "1 each" },
  { name: "Black Bean Burger", category: "Grill", portion: "1 each" },
  { name: "Brown Rice", category: "Sides", portion: "1 cup" },
  { name: "Roasted Sweet Potatoes", category: "Sides", portion: "1 cup" },
  { name: "Steamed Broccoli", category: "Sides", portion: "1 cup" },
  { name: "Garden Salad", category: "Salad Bar", portion: "1 bowl" },
  { name: "Scrambled Tofu", category: "Vegan", portion: "1 cup" },
  { name: "Whole Wheat Pasta", category: "Pasta", portion: "1 cup" },
  { name: "Marinara Sauce", category: "Pasta", portion: "1/2 cup" },
  { name: "Grilled Salmon", category: "Grill", portion: "1 fillet" },
  { name: "Greek Yogurt", category: "Breakfast", portion: "1 cup" },
  { name: "Mixed Berries", category: "Fruit", portion: "1 cup" },
]

export default function HomePage() {
  // Selection
  const [hallId, setHallId] = useState<string>("")
  const [meal, setMeal] = useState<string>("")

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
  const canSubmit = Boolean(hallId && meal) && !isLoading

  const handleHallChange = (value: string) => {
    setHallId(value)
    setMeal("")
  }

  const toggleDiet = (value: Diet) => {
    setDiets((prev) => (prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value]))
  }

  const getRecommendations = async () => {
    if (!hallId || !meal) return
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
          menuItems: MOCK_MENU_ITEMS,
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

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong generating recommendations.")
      }
      setPlates(data.plates ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

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
          Pick a dining hall and meal, set your goals, and get AI-recommended plates with macros — built from the
          menu.
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

          <div className="space-y-2">
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
            <p className="text-center text-xs text-muted-foreground">
              Using a sample menu for now — live Rutgers menus arrive in a later step.
            </p>
          </div>
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
                Choose a hall and meal, set your goal, and hit Get Recommendations to see three AI-built plates with
                macros.
              </p>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  )
}
