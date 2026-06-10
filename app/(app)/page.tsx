"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import {
  Sparkles,
  ArrowRight,
  Loader2,
  MapPin,
  Dumbbell,
  Utensils,
  Clock,
  Target,
  Leaf,
  Flame,
  Soup,
  WheatOff,
} from "lucide-react"
import { DINING_HALLS, getDiningHallById, formatMealPeriod } from "@/lib/dining-halls"
import type { LoggedMeal, MenuItem, MenuSource, RemainingTargets } from "@/lib/types"
import type { RecommendedPlate } from "@/lib/ai/plate-schema"
import { usePrefs, useSavedPlates, useLoggedMeals } from "@/lib/store"
import { estimateTargets, targetSourceNote } from "@/lib/nutrition/targets"
import { getLocalDateKey } from "@/lib/date"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import GoalSummary from "@/components/home/GoalSummaryCard"
import TodaysPick from "@/components/recommend/TodaysPick"
import RecommendationGrid from "@/components/recommend/RecommendationGrid"
import RecommendationLoading from "@/components/recommend/RecommendationLoading"
import RecommendationError from "@/components/recommend/RecommendationError"
import {
  MacroTargetCard,
  LiveMenuCard,
  DiningHallsCard,
  SavedCallout,
  TrustBadge,
} from "@/components/home/sidebar"
import TodaysFuelCard from "@/components/home/TodaysFuelCard"
import MealLogDialog, { draftFromPlate, type MealDraft } from "@/components/log/MealLogDialog"

/** Format today's date the way /api/menu expects: M/D/YYYY. */
function todayMenuDate(): string {
  const d = new Date()
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`
}

const QUICK_FILTERS: { id: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "high protein", label: "High protein", icon: Dumbbell },
  { id: "lower calorie", label: "Lower calorie", icon: Flame },
  { id: "vegetarian", label: "Vegetarian", icon: Leaf },
  { id: "comfort food", label: "Comfort", icon: Soup },
  { id: "gluten-free", label: "Gluten-free", icon: WheatOff },
]

const HERO_FEATURES = [
  { icon: Utensils, label: "4 dining halls" },
  { icon: Clock, label: "Today's live menus" },
  { icon: Target, label: "Goal-matched plates" },
]

/** Numbered, icon-led card header. */
function StepTitle({
  n,
  title,
  icon: Icon,
}: {
  n: number
  title: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
        {n}
      </span>
      <Icon className="h-4 w-4 text-primary" />
      <h2 className="text-base font-semibold">{title}</h2>
    </div>
  )
}

export default function HomePage() {
  // Selection
  const [hallId, setHallId] = useState<string>("")
  const [meal, setMeal] = useState<string>("")

  // Live menu
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [menuSource, setMenuSource] = useState<MenuSource | null>(null)
  const [isMenuLoading, setIsMenuLoading] = useState(false)
  const [menuError, setMenuError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  // Preferences come from Settings (the single source of truth).
  const { prefs } = usePrefs()

  // Quick filters (session only)
  const [filters, setFilters] = useState<string[]>([])

  // Saved plates (localStorage)
  const { savePlate, removePlate, isSaved } = useSavedPlates()

  // Logged meals (localStorage) — owned here so logging updates Today's Fuel instantly.
  const { addLoggedMeal, getTodayMeals, getTotalsForDate } = useLoggedMeals()
  const todayMeals = getTodayMeals()
  const todayTotals = getTotalsForDate(getLocalDateKey())

  // Portion-adjust dialog before logging a recommendation.
  const [logDraft, setLogDraft] = useState<MealDraft | null>(null)
  const [logOpen, setLogOpen] = useState(false)

  // Results
  const [plates, setPlates] = useState<RecommendedPlate[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hall = getDiningHallById(hallId)
  const menuReady = menuItems.length > 0
  const hasSelection = Boolean(hallId && meal)
  const canSubmit = Boolean(hasSelection && menuReady) && !isLoading && !isMenuLoading

  // Estimated daily targets from saved preferences.
  const targets = estimateTargets(prefs.goal, prefs.profile, prefs.calorieTarget)
  const targetNote = targetSourceNote(targets, prefs.profile)

  // Room left for the rest of today (targets − what's already logged). Values may
  // go negative when over a target; we clamp only where we *display* them.
  const loggedMealCountToday = todayMeals.length
  const hasLoggedToday = loggedMealCountToday > 0
  const remainingTargets: RemainingTargets = {
    calories: targets.calories - todayTotals.calories,
    protein: targets.protein - todayTotals.protein,
    carbs: targets.carbs - todayTotals.carbs,
    fat: targets.fat - todayTotals.fat,
  }

  const handleHallChange = (value: string) => {
    setHallId(value)
    setMeal("")
  }

  const toggleFilter = (id: string) => {
    setFilters((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]))
  }

  const toggleSave = (plate: RecommendedPlate) => {
    if (isSaved(plate.id)) {
      removePlate(plate.id)
      toast("Removed from saved")
    } else {
      savePlate(plate)
      toast.success("Saved to your plates")
    }
  }

  const handleLogMeal = (plate: RecommendedPlate) => {
    if (!hall || !meal) return
    setLogDraft(draftFromPlate(plate, hall.name, formatMealPeriod(meal)))
    setLogOpen(true)
  }

  const handleConfirmLog = (loggedMeal: Omit<LoggedMeal, "id" | "loggedAt">) => {
    addLoggedMeal(loggedMeal)
    toast.success(`Logged "${loggedMeal.title}" for today.`)
  }

  // Load the live menu whenever a hall + meal are both selected (or on retry).
  useEffect(() => {
    const selectedHall = getDiningHallById(hallId)
    if (!selectedHall || !meal) {
      setMenuItems([])
      setMenuSource(null)
      setMenuError(null)
      return
    }

    let ignore = false
    const controller = new AbortController()

    setIsMenuLoading(true)
    setMenuError(null)
    setMenuItems([])
    setMenuSource(null)
    setPlates(null)
    setError(null)

    fetch("/api/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ diningHall: selectedHall.name, date: todayMenuDate(), mealPeriod: meal }),
      signal: controller.signal,
    })
      .then(async (res) => {
        const data = (await res.json()) as { menuItems?: MenuItem[]; source?: MenuSource | null; error?: string }
        if (!res.ok) throw new Error(data.error || "Failed to load the menu.")
        return data
      })
      .then((data) => {
        if (ignore) return
        setMenuItems(data.menuItems ?? [])
        setMenuSource(data.source ?? null)
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
          userPrefs: prefs,
          macroTargets: targets,
          filters,
          // Remaining-day context (backward-compatible; omitted fields are fine).
          todayTotals,
          remainingTargets,
          loggedMealCountToday,
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

  const disabledHint = !hallId || !meal
    ? "Pick a dining hall and meal to load today's menu."
    : menuError
      ? "Couldn't load the menu — check the Live menu panel."
      : "Loading today's menu…"

  return (
    <div className="space-y-8">
      {/* Hero — landing-style */}
      <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary via-[#9b0026] to-zinc-900 text-white shadow-sm">
        <div aria-hidden className="pointer-events-none absolute -left-16 -top-24 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 right-10 h-64 w-64 rounded-full bg-black/30 blur-3xl" />
        <div className="relative grid gap-8 px-6 py-10 sm:px-10 sm:py-12 lg:grid-cols-[1.5fr_1fr] lg:items-center">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
              <MapPin className="h-3.5 w-3.5" />
              Rutgers–New Brunswick
            </span>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Eat for your goals on campus.</h1>
            <p className="max-w-xl text-pretty text-white/80">
              Tell us your goal, then get AI-built dining hall plates with full macros from today&apos;s live menus —
              matched to how you want to eat.
            </p>
            <div className="flex flex-wrap gap-2 pt-1 text-xs text-white/90">
              {["Busch", "Livingston", "Neilson", "The Atrium"].map((h) => (
                <span key={h} className="rounded-full bg-white/10 px-2.5 py-1 backdrop-blur">
                  {h}
                </span>
              ))}
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="space-y-3 rounded-xl border border-white/15 bg-white/10 p-5 backdrop-blur">
              {HERO_FEATURES.map((f) => (
                <div key={f.label} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
                    <f.icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard: main flow + context sidebar */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main */}
        <div className="space-y-6 lg:col-span-2">
          {/* Step 1: review today's goal (managed in Settings) */}
          <Card>
            <CardHeader>
              <StepTitle n={1} title="Review today's goal" icon={Target} />
            </CardHeader>
            <CardContent>
              <GoalSummary
                goal={prefs.goal}
                targets={targets}
                diets={prefs.diets}
                avoid={prefs.avoid}
                note={targetNote}
              />
            </CardContent>
          </Card>

          {/* Step 2: hall + meal */}
          <Card>
            <CardHeader>
              <StepTitle n={2} title="Pick a dining hall & meal" icon={MapPin} />
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          {/* Step 3: quick filters (session-only intent) */}
          <Card>
            <CardHeader>
              <StepTitle n={3} title="Choose quick filters" icon={Leaf} />
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1.5">
                <Label>Quick filters</Label>
                <p className="text-xs text-muted-foreground">
                  Optional, just for this search — your saved diet preferences always apply.
                </p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_FILTERS.map((f) => {
                    const active = filters.includes(f.id)
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => toggleFilter(f.id)}
                        aria-pressed={active}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors",
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-input bg-background hover:bg-muted",
                        )}
                      >
                        <f.icon className="h-3.5 w-3.5" />
                        {f.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="space-y-2">
            <Button className="w-full gap-2 shadow-sm" size="lg" disabled={!canSubmit} onClick={getRecommendations}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {hasLoggedToday ? "Get recommendations for the rest of today" : "Get Recommendations"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
            {!canSubmit && !isLoading && <p className="text-center text-xs text-muted-foreground">{disabledHint}</p>}
            {hasLoggedToday && !isLoading && (
              <p className="text-center text-xs text-muted-foreground">
                Based on your remaining{" "}
                <span className="tabular-nums">{Math.max(0, Math.round(remainingTargets.calories)).toLocaleString()}</span>{" "}
                kcal and <span className="tabular-nums">{Math.max(0, Math.round(remainingTargets.protein))}</span>g protein
                today.
              </p>
            )}
          </div>

          {/* Results — the main product moment */}
          {isLoading && (
            <section className="space-y-4">
              <h2 className="text-xl font-bold tracking-tight">Finding your plates…</h2>
              <RecommendationLoading />
            </section>
          )}

          {!isLoading && error && <RecommendationError message={error} onRetry={getRecommendations} />}

          {!isLoading && !error && plates && plates.length > 0 && (
            <section className="space-y-6">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Your picks</p>
                <h2 className="text-xl font-bold tracking-tight">Your recommendations</h2>
                <p className="text-sm text-muted-foreground">
                  {hall?.name} · {formatMealPeriod(meal)} · tailored to your goal
                </p>
                {hasLoggedToday ? (
                  <p className="text-xs text-muted-foreground">
                    Tuned to your remaining ~{Math.max(0, Math.round(remainingTargets.calories)).toLocaleString()} kcal and{" "}
                    {Math.max(0, Math.round(remainingTargets.protein))}g protein for the rest of today.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Aiming for ~{Math.round(targets.calories / 3)} kcal this meal (about a third of your ~
                    {targets.calories} kcal/day estimate).
                  </p>
                )}
              </div>
              <TodaysPick
                plate={plates[0]}
                saved={isSaved(plates[0].id)}
                onToggleSave={toggleSave}
                onLogMeal={handleLogMeal}
                remaining={hasLoggedToday ? remainingTargets : undefined}
              />
              <RecommendationGrid
                plates={plates.slice(1)}
                isSaved={isSaved}
                onToggleSave={toggleSave}
                onLogMeal={handleLogMeal}
                remaining={hasLoggedToday ? remainingTargets : undefined}
              />
            </section>
          )}

          {!isLoading && !error && !plates && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Your recommendations will appear here</p>
                  <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                    Set your goal, pick a hall and meal, then generate three AI-built plates with full macros.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Context sidebar */}
        <aside className="space-y-4 lg:col-span-1">
          <MacroTargetCard targets={targets} note={targetNote} />
          <TodaysFuelCard totals={todayTotals} meals={todayMeals} targets={targets} note={targetNote} />
          <LiveMenuCard
            hasSelection={hasSelection}
            hallName={hall?.name}
            mealLabel={meal ? formatMealPeriod(meal) : undefined}
            count={menuItems.length}
            isLoading={isMenuLoading}
            error={menuError}
            source={menuSource}
            onRetry={reloadMenu}
          />
          <DiningHallsCard />
          <SavedCallout />
          <TrustBadge />
        </aside>
      </div>

      <MealLogDialog
        mode="create"
        open={logOpen}
        onOpenChange={setLogOpen}
        draft={logDraft}
        onConfirm={handleConfirmLog}
      />
    </div>
  )
}
