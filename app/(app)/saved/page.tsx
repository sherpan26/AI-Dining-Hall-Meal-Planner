"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Bookmark, Search, Flame, Dumbbell, Clock } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { useSavedPlates, useLoggedMeals } from "@/lib/store"
import { getDiningHallById, formatMealPeriod } from "@/lib/dining-halls"
import type { LoggedMeal, SavedPlate } from "@/lib/types"
import type { RecommendedPlate } from "@/lib/ai/plate-schema"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import SavedPlateCard from "@/components/saved/SavedPlateCard"
import MealLogDialog, { draftFromPlate, type MealDraft } from "@/components/log/MealLogDialog"

// Reasonable, simple thresholds for the tag-light filters.
const HIGH_PROTEIN_G = 30
const LOWER_CALORIE_KCAL = 600

const FILTERS = [
  { id: "all", label: "All" },
  { id: "high-protein", label: "High protein" },
  { id: "lower-calorie", label: "Lower calorie" },
  { id: "vegetarian", label: "Vegetarian" },
  { id: "gluten-free", label: "Gluten-free" },
  { id: "logged", label: "Logged before" },
] as const
type FilterId = (typeof FILTERS)[number]["id"]

const SORTS = [
  { id: "newest", label: "Newest saved" },
  { id: "oldest", label: "Oldest saved" },
  { id: "protein", label: "Highest protein" },
  { id: "cal-asc", label: "Lowest calories" },
  { id: "cal-desc", label: "Highest calories" },
] as const
type SortId = (typeof SORTS)[number]["id"]

const lc = (s: string) => s.toLowerCase()
const tagsOf = (p: SavedPlate) => (p.tags ?? []).map(lc)
const hasTag = (p: SavedPlate, sub: string) => tagsOf(p).some((t) => t.includes(sub))
const mentionsGluten = (text: string) => /gluten|wheat/i.test(text)

function isHighProtein(p: SavedPlate) {
  return hasTag(p, "high-protein") || p.totals.protein >= HIGH_PROTEIN_G
}
function isLowerCalorie(p: SavedPlate) {
  return hasTag(p, "low-calorie") || hasTag(p, "lower-calorie") || hasTag(p, "under") || p.totals.calories <= LOWER_CALORIE_KCAL
}
function isVegetarian(p: SavedPlate) {
  return hasTag(p, "vegetarian") || hasTag(p, "vegan")
}
function isGlutenFree(p: SavedPlate) {
  if (hasTag(p, "gluten-free")) return true
  // Reliable-enough heuristic: no gluten/wheat called out in the plate's warnings.
  return !mentionsGluten((p.warnings ?? []).join(" "))
}

function matchesQuery(p: SavedPlate, q: string, hallName: string) {
  if (!q) return true
  const haystack = [p.title, ...(p.tags ?? []), ...p.items.map((i) => i.name), hallName, formatMealPeriod(p.meal), p.meal]
    .join(" ")
    .toLowerCase()
  return haystack.includes(lc(q))
}

/** Small labelled stat card for the summary row. */
function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold tabular-nums leading-tight">{value}</p>
          <p className="truncate text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function SavedPage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const { savedPlates, removePlate } = useSavedPlates()
  const { addLoggedMeal, loggedMeals } = useLoggedMeals()

  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<FilterId>("all")
  const [sort, setSort] = useState<SortId>("newest")

  // Portion-adjust dialog before logging from the library.
  const [logDraft, setLogDraft] = useState<MealDraft | null>(null)
  const [logOpen, setLogOpen] = useState(false)

  const count = savedPlates.length

  // Which saved plates have been logged at least once (by id or title).
  const loggedLookup = useMemo(() => {
    const ids = new Set(loggedMeals.map((m) => m.plateId).filter(Boolean) as string[])
    const titles = new Set(loggedMeals.map((m) => lc(m.title)))
    return { ids, titles }
  }, [loggedMeals])

  const isLoggedBefore = (p: SavedPlate) => loggedLookup.ids.has(p.id) || loggedLookup.titles.has(lc(p.title))

  const stats = useMemo(() => {
    if (count === 0) return null
    const avgCalories = Math.round(savedPlates.reduce((s, p) => s + p.totals.calories, 0) / count)
    const topProtein = Math.round(Math.max(...savedPlates.map((p) => p.totals.protein)))
    const lastSaved = Math.max(...savedPlates.map((p) => p.savedAt))
    return { avgCalories, topProtein, lastSaved }
  }, [savedPlates, count])

  const visible = useMemo(() => {
    const list = savedPlates.filter((p) => {
      const hallName = getDiningHallById(p.hall)?.name ?? p.hall
      if (!matchesQuery(p, query, hallName)) return false
      switch (filter) {
        case "high-protein":
          return isHighProtein(p)
        case "lower-calorie":
          return isLowerCalorie(p)
        case "vegetarian":
          return isVegetarian(p)
        case "gluten-free":
          return isGlutenFree(p)
        case "logged":
          return isLoggedBefore(p)
        default:
          return true
      }
    })

    return [...list].sort((a, b) => {
      switch (sort) {
        case "oldest":
          return a.savedAt - b.savedAt
        case "protein":
          return b.totals.protein - a.totals.protein
        case "cal-asc":
          return a.totals.calories - b.totals.calories
        case "cal-desc":
          return b.totals.calories - a.totals.calories
        default:
          return b.savedAt - a.savedAt
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedPlates, query, filter, sort, loggedLookup])

  const handleLog = (plate: RecommendedPlate) => {
    const hall = getDiningHallById(plate.hall)
    setLogDraft(draftFromPlate(plate, hall?.name ?? plate.hall, formatMealPeriod(plate.meal)))
    setLogOpen(true)
  }

  const handleConfirmLog = (meal: Omit<LoggedMeal, "id" | "loggedAt">) => {
    addLoggedMeal(meal)
    toast.success(`Logged "${meal.title}" for today.`)
  }

  const handleRemove = (id: string) => {
    const removed = savedPlates.find((p) => p.id === id)
    removePlate(id)
    toast(`Removed "${removed?.title ?? "plate"}" from saved`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Rutgers–New Brunswick</p>
        <h1 className="text-2xl font-bold tracking-tight">Saved Plates</h1>
        <p className="text-muted-foreground">Meals you bookmarked for later. Search, filter, and log them again anytime.</p>
      </div>

      {!mounted ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">Loading your library…</CardContent>
        </Card>
      ) : count === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Bookmark className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">No saved plates yet.</p>
              <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                Generate recommendations and bookmark plates you want to reuse later.
              </p>
            </div>
            <Button asChild className="mt-1">
              <Link href="/">Get recommendations</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard icon={Bookmark} label="Saved plates" value={String(count)} />
              <StatCard icon={Flame} label="Avg calories" value={`${stats.avgCalories.toLocaleString()}`} />
              <StatCard icon={Dumbbell} label="Top protein" value={`${stats.topProtein}g`} />
              <StatCard icon={Clock} label="Last saved" value={format(stats.lastSaved, "MMM d")} />
            </div>
          )}

          {/* Controls */}
          <div className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search saved plates, ingredients, tags..."
                  className="pl-9"
                  aria-label="Search saved plates"
                />
              </div>
              <Select value={sort} onValueChange={(v) => setSort(v as SortId)}>
                <SelectTrigger className="sm:w-52" aria-label="Sort saved plates">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORTS.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-2">
              {FILTERS.map((f) => {
                const active = filter === f.id
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFilter(f.id)}
                    aria-pressed={active}
                    className={cn(
                      "rounded-full border px-3 py-1 text-sm transition-colors",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input bg-background hover:bg-muted",
                    )}
                  >
                    {f.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Results */}
          {visible.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                <Search className="h-6 w-6 text-muted-foreground" />
                <p className="text-sm font-medium">No saved plates match your filters.</p>
                <p className="text-xs text-muted-foreground">Try a different search term or filter.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {visible.map((plate) => (
                <SavedPlateCard
                  key={plate.id}
                  plate={plate}
                  loggedBefore={isLoggedBefore(plate)}
                  onLog={handleLog}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          )}
        </>
      )}

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
