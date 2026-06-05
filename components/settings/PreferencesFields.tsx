"use client"

import { Leaf, Target } from "lucide-react"
import type { ActivityLevel, Diet, Goal, UserPrefs, UserProfile } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

/**
 * UI form state for preferences. Numeric/optional fields are kept as raw input
 * strings here; convert with `formToPrefs` before saving.
 */
export interface PrefsFormState {
  goal: Goal
  diets: Diet[]
  avoid: string
  calorieTarget: string
  age: string
  heightCm: string
  weightKg: string
  activity: ActivityLevel | ""
}

export const GOAL_OPTIONS: { value: Goal; label: string }[] = [
  { value: "maintain", label: "Maintain" },
  { value: "lose", label: "Lose weight" },
  { value: "gain", label: "Gain weight" },
  { value: "muscle", label: "Build muscle" },
  { value: "protein", label: "High protein" },
]

const DIET_OPTIONS: { value: Diet; label: string }[] = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "halal", label: "Halal" },
  { value: "gluten-free", label: "Gluten-free" },
]

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string }[] = [
  { value: "sedentary", label: "Sedentary" },
  { value: "light", label: "Lightly active" },
  { value: "moderate", label: "Moderately active" },
  { value: "active", label: "Active" },
  { value: "very-active", label: "Very active" },
]

const ACTIVITY_NONE = "none"

function toNum(s: string): number | undefined {
  const n = Number(s)
  return s.trim() !== "" && !Number.isNaN(n) && n > 0 ? n : undefined
}

/** Convert persisted preferences into editable form state. */
export function prefsToForm(prefs: UserPrefs): PrefsFormState {
  return {
    goal: prefs.goal,
    diets: prefs.diets,
    avoid: prefs.avoid.join(", "),
    calorieTarget: prefs.calorieTarget != null ? String(prefs.calorieTarget) : "",
    age: prefs.profile?.age != null ? String(prefs.profile.age) : "",
    heightCm: prefs.profile?.heightCm != null ? String(prefs.profile.heightCm) : "",
    weightKg: prefs.profile?.weightKg != null ? String(prefs.profile.weightKg) : "",
    activity: prefs.profile?.activity ?? "",
  }
}

/** Convert form state back into persisted preferences. */
export function formToPrefs(form: PrefsFormState): UserPrefs {
  const age = toNum(form.age)
  const heightCm = toNum(form.heightCm)
  const weightKg = toNum(form.weightKg)
  const activity = form.activity || undefined

  const profile: UserProfile | undefined =
    age || heightCm || weightKg || activity ? { age, heightCm, weightKg, activity } : undefined

  return {
    goal: form.goal,
    diets: form.diets,
    avoid: form.avoid
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    calorieTarget: toNum(form.calorieTarget),
    profile,
  }
}

interface FieldProps {
  value: PrefsFormState
  onChange: (next: PrefsFormState) => void
}

/** Goal selector. */
export function GoalSelect({ value, onChange }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5">
        <Target className="h-3.5 w-3.5 text-primary" />
        Goal
      </Label>
      <Select value={value.goal} onValueChange={(v) => onChange({ ...value, goal: v as Goal })}>
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
  )
}

/** Optional profile + manual calorie override. */
export function ProfileFields({ value, onChange }: FieldProps) {
  const activityValue = value.activity || ACTIVITY_NONE
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Optional — improves your calorie &amp; macro estimate.</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="age">Age</Label>
          <Input
            id="age"
            type="number"
            inputMode="numeric"
            placeholder="20"
            value={value.age}
            onChange={(e) => onChange({ ...value, age: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="heightCm">Height (cm)</Label>
          <Input
            id="heightCm"
            type="number"
            inputMode="numeric"
            placeholder="178"
            value={value.heightCm}
            onChange={(e) => onChange({ ...value, heightCm: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="weightKg">Weight (kg)</Label>
          <Input
            id="weightKg"
            type="number"
            inputMode="numeric"
            placeholder="75"
            value={value.weightKg}
            onChange={(e) => onChange({ ...value, weightKg: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="calorieTarget">Calories</Label>
          <Input
            id="calorieTarget"
            type="number"
            inputMode="numeric"
            placeholder="auto"
            value={value.calorieTarget}
            onChange={(e) => onChange({ ...value, calorieTarget: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Activity level</Label>
        <Select
          value={activityValue}
          onValueChange={(v) => onChange({ ...value, activity: v === ACTIVITY_NONE ? "" : (v as ActivityLevel) })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Not set" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ACTIVITY_NONE}>Not set</SelectItem>
            {ACTIVITY_OPTIONS.map((a) => (
              <SelectItem key={a.value} value={a.value}>
                {a.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <p className="text-[11px] text-muted-foreground">
        A manual calorie value overrides the estimate. Estimates only — not medical advice.
      </p>
    </div>
  )
}

/** Dietary restriction chips. */
export function DietChips({ value, onChange }: FieldProps) {
  const toggleDiet = (diet: Diet) => {
    onChange({
      ...value,
      diets: value.diets.includes(diet) ? value.diets.filter((d) => d !== diet) : [...value.diets, diet],
    })
  }
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5">
        <Leaf className="h-3.5 w-3.5 text-primary" />
        Dietary restrictions
      </Label>
      <div className="flex flex-wrap gap-2">
        {DIET_OPTIONS.map((d) => {
          const active = value.diets.includes(d.value)
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
  )
}

/** Foods-to-avoid free-text input. */
export function AvoidInput({ value, onChange }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="avoid">Foods to avoid</Label>
      <Input
        id="avoid"
        placeholder="e.g. mushrooms, shellfish"
        value={value.avoid}
        onChange={(e) => onChange({ ...value, avoid: e.target.value })}
      />
    </div>
  )
}

/** Full preferences form (goal + profile + diet + avoid) — used by Settings. */
export default function PreferencesFields({ value, onChange }: FieldProps) {
  return (
    <div className="space-y-6">
      <GoalSelect value={value} onChange={onChange} />
      <ProfileFields value={value} onChange={onChange} />
      <DietChips value={value} onChange={onChange} />
      <AvoidInput value={value} onChange={onChange} />
    </div>
  )
}
