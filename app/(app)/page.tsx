"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { Sparkles, ArrowRight, Loader2, CheckCircle2, AlertCircle, RotateCw } from "lucide-react"
import { DINING_HALLS, getDiningHallById, formatMealPeriod } from "@/lib/dining-halls"
import type { MenuItem } from "@/lib/types"
import type { RecommendedPlate } from "@/lib/ai/plate-schema"
import { usePrefs, useSavedPlates } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import PreferencesFields, {
  formToPrefs,
  prefsToForm,
  type PrefsFormState,
} from "@/components/settings/PreferencesFields"
import TodaysPick from "@/components/recommend/TodaysPick"
import RecommendationGrid from "@/components/recommend/RecommendationGrid"
import RecommendationLoading from "@/components/recommend/RecommendationLoading"
import RecommendationError from "@/components/recommend/RecommendationError"

/** Format today's date the way /api/menu expects: M/D/YYYY. */
function todayMenuDate(): string {
  const d = new Date()
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`
}

/** Numbered section heading used to guide the user through the flow. */
function StepHeading({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
        {n}
      </span>
      <h3 className="text-sm font-semibold">{title}</h3>
    </div>
  )
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

  // Preferences — seeded from saved prefs, editable here before generating.
  const { prefs, setPrefs } = usePrefs()
  const [prefsForm, setPrefsForm] = useState<PrefsFormState>(() => prefsToForm(prefs))

  // Re-seed the form when stored prefs change (hydration, saved in Settings, other tab).
  useEffect(() => {
    setPrefsForm(prefsToForm(prefs))
  }, [prefs])

  // Saved plates (localStorage)
  const { savePlate, removePlate, isSaved } = useSavedPlates()

  // Results
  const [plates, setPlates] = useState<RecommendedPlate[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hall = getDiningHallById(hallId)
  const menuReady = menuItems.length > 0
  const canSubmit = Boolean(hallId && meal && menuReady) && !isLoading && !isMenuLoading

  const prefsDirty = JSON.stringify(formToPrefs(prefsForm)) !== JSON.stringify(prefs)

  const handleHallChange = (value: string) => {
    setHallId(value)
    setMeal("")
  }

  const saveAsDefault = () => {
    setPrefs(formToPrefs(prefsForm))
    toast.success("Saved as your default preferences")
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
          userPrefs: formToPrefs(prefsForm),
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
          <CardTitle className="text-lg">Build your plate</CardTitle>
          <CardDescription>Three quick steps to a recommendation from today&apos;s menu.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: hall + meal */}
          <StepHeading n={1} title="Pick a dining hall & meal" />
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
            <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
              {isMenuLoading && (
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading today&apos;s menu…
                </span>
              )}
              {!isMenuLoading && menuError && (
                <span className="flex flex-wrap items-center gap-1.5 text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  Couldn&apos;t load the menu: {menuError}
                  <button onClick={reloadMenu} className="inline-flex items-center gap-1 font-medium underline">
                    <RotateCw className="h-3 w-3" /> Retry
                  </button>
                </span>
              )}
              {!isMenuLoading && !menuError && menuReady && (
                <span className="flex items-center gap-2 font-medium text-foreground">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                  {menuItems.length} items on today&apos;s {formatMealPeriod(meal)} menu at {hall?.name}
                </span>
              )}
              {!isMenuLoading && !menuError && !menuReady && (
                <span className="flex flex-wrap items-center gap-1.5 text-muted-foreground">
                  No items found — this meal may not be served right now.
                  <button onClick={reloadMenu} className="inline-flex items-center gap-1 font-medium underline">
                    <RotateCw className="h-3 w-3" /> Retry
                  </button>
                </span>
              )}
            </div>
          )}

          <Separator />

          {/* Step 2: preferences (seeded from saved defaults) */}
          <StepHeading n={2} title="Set your preferences" />
          <PreferencesFields value={prefsForm} onChange={setPrefsForm} />

          {prefsDirty && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/40 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Using custom preferences for this session.</span>
              <Button variant="outline" size="sm" onClick={saveAsDefault}>
                Save as default
              </Button>
            </div>
          )}

          <Separator />

          {/* Step 3: generate */}
          <StepHeading n={3} title="Get your recommendations" />
          <Button className="w-full gap-2" size="lg" disabled={!canSubmit} onClick={getRecommendations}>
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
          {!canSubmit && !isLoading && (
            <p className="text-center text-xs text-muted-foreground">
              {hallId && meal ? "Waiting for today's menu to load…" : "Choose a dining hall and meal to begin."}
            </p>
          )}
        </CardContent>
      </Card>

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
            <h2 className="text-xl font-bold tracking-tight">Your recommendations</h2>
            <p className="text-sm text-muted-foreground">
              {hall?.name} · {formatMealPeriod(meal)} · tailored to your goal
            </p>
          </div>
          <TodaysPick plate={plates[0]} saved={isSaved(plates[0].id)} onToggleSave={toggleSave} />
          <RecommendationGrid plates={plates.slice(1)} isSaved={isSaved} onToggleSave={toggleSave} />
        </section>
      )}

      {!isLoading && !error && !plates && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <p className="font-medium">Your recommendations will appear here</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Pick a hall and meal to load today&apos;s menu, set your goal, then generate three AI-built plates with
              full macros.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
