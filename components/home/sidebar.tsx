"use client"

import Link from "next/link"
import {
  Clock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  MapPin,
  Dumbbell,
  Sparkles,
  Bookmark,
  ShieldCheck,
  Utensils,
  Flame,
  Gauge,
} from "lucide-react"
import { DINING_HALLS } from "@/lib/dining-halls"
import type { MacroTargets } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

/** Estimated daily calorie/macro targets derived from the user's goal/profile. */
export function MacroTargetCard({ targets, note }: { targets: MacroTargets; note: string }) {
  const stats: { label: string; value: string }[] = [
    { label: "Protein", value: `${targets.protein}g` },
    { label: "Carbs", value: `${targets.carbs}g` },
    { label: "Fat", value: `${targets.fat}g` },
  ]
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Gauge className="h-4 w-4 text-primary" />
          Estimated daily targets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline gap-2">
          <Flame className="h-5 w-5 text-primary" />
          <span className="text-2xl font-bold tabular-nums">{targets.calories}</span>
          <span className="text-sm text-muted-foreground">kcal / day</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {stats.map((s) => (
            <div key={s.label} className="rounded-md bg-muted py-2 text-center">
              <div className="text-sm font-semibold tabular-nums">{s.value}</div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">{note} · estimate, not medical advice.</p>
      </CardContent>
    </Card>
  )
}

export interface LiveMenuCardProps {
  hasSelection: boolean
  hallName?: string
  mealLabel?: string
  count: number
  isLoading: boolean
  error: string | null
  onRetry: () => void
}

/** Live menu status widget — reflects the current hall/meal selection. */
export function LiveMenuCard({ hasSelection, hallName, mealLabel, count, isLoading, error, onRetry }: LiveMenuCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-primary" />
          Live menu
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm">
        {!hasSelection && (
          <p className="text-muted-foreground">Pick a dining hall and meal to load today&apos;s menu.</p>
        )}
        {hasSelection && isLoading && (
          <p className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading today&apos;s menu…
          </p>
        )}
        {hasSelection && !isLoading && error && (
          <div className="space-y-2">
            <p className="flex items-start gap-1.5 text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </p>
            <Button size="sm" variant="outline" className="gap-1" onClick={onRetry}>
              <RotateCw className="h-3 w-3" /> Retry
            </Button>
          </div>
        )}
        {hasSelection && !isLoading && !error && count > 0 && (
          <div className="space-y-1">
            <p className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              {count} items today
            </p>
            <p className="text-xs text-muted-foreground">
              {hallName} · {mealLabel}
            </p>
          </div>
        )}
        {hasSelection && !isLoading && !error && count === 0 && (
          <div className="space-y-2">
            <p className="text-muted-foreground">No items found — this meal may not be served right now.</p>
            <Button size="sm" variant="outline" className="gap-1" onClick={onRetry}>
              <RotateCw className="h-3 w-3" /> Retry
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

const HOW_IT_WORKS = [
  { icon: MapPin, title: "Pick a hall & meal", desc: "Choose where and when you're eating." },
  { icon: Dumbbell, title: "Set your goals", desc: "Goal, diet, and foods to avoid." },
  { icon: Sparkles, title: "Get your AI plate", desc: "Three plates with full macros." },
]

/** Three-step explainer. */
export function HowItWorksCard() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">How it works</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {HOW_IT_WORKS.map((s, i) => (
          <div key={s.title} className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <s.icon className="h-4 w-4" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium">
                {i + 1}. {s.title}
              </p>
              <p className="text-xs text-muted-foreground">{s.desc}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

/** The four Rutgers–New Brunswick dining halls. */
export function DiningHallsCard() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-primary" />
          Dining halls
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-2 text-xs text-muted-foreground">Rutgers–New Brunswick</p>
        <ul className="space-y-1.5">
          {DINING_HALLS.map((h) => (
            <li key={h.id} className="flex items-center gap-2 text-sm">
              <Utensils className="h-3.5 w-3.5 text-muted-foreground" />
              {h.name}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

/** Mini callout linking to saved plates. */
export function SavedCallout() {
  return (
    <Card className="bg-accent/50">
      <CardContent className="flex items-start gap-3 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Bookmark className="h-4 w-4" />
        </div>
        <div className="space-y-2">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Saved plates</p>
            <p className="text-xs text-muted-foreground">Bookmark plates to revisit anytime — saved on this device.</p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/saved">View saved</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/** Trust badge — reinforces the live-menu value prop. */
export function TrustBadge() {
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-xs text-muted-foreground">
      <ShieldCheck className="h-4 w-4 shrink-0 text-green-600" />
      <span>Uses today&apos;s live dining menus only — no stale data.</span>
    </div>
  )
}
