"use client"

import type { Diet, Goal, UserPrefs } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

/**
 * UI form state for preferences. `avoid` and `calorieTarget` are kept as raw
 * input strings here for convenience; convert with `formToPrefs` before saving.
 */
export interface PrefsFormState {
  goal: Goal
  diets: Diet[]
  avoid: string
  calorieTarget: string
}

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

/** Convert persisted preferences into editable form state. */
export function prefsToForm(prefs: UserPrefs): PrefsFormState {
  return {
    goal: prefs.goal,
    diets: prefs.diets,
    avoid: prefs.avoid.join(", "),
    calorieTarget: prefs.calorieTarget != null ? String(prefs.calorieTarget) : "",
  }
}

/** Convert form state back into persisted preferences. */
export function formToPrefs(form: PrefsFormState): UserPrefs {
  const calorie = Number(form.calorieTarget)
  return {
    goal: form.goal,
    diets: form.diets,
    avoid: form.avoid
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    calorieTarget: form.calorieTarget.trim() && !Number.isNaN(calorie) ? calorie : undefined,
  }
}

interface PreferencesFieldsProps {
  value: PrefsFormState
  onChange: (next: PrefsFormState) => void
}

/** Reusable goal / diet / avoid / calorie-target fields (controlled). */
export default function PreferencesFields({ value, onChange }: PreferencesFieldsProps) {
  const toggleDiet = (diet: Diet) => {
    onChange({
      ...value,
      diets: value.diets.includes(diet) ? value.diets.filter((d) => d !== diet) : [...value.diets, diet],
    })
  }

  return (
    <div className="space-y-6">
      {/* Goal */}
      <div className="space-y-1.5">
        <Label>Goal</Label>
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

      {/* Diet chips */}
      <div className="space-y-1.5">
        <Label>Dietary restrictions</Label>
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

      {/* Avoid + calorie target */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="avoid">Foods to avoid</Label>
          <Input
            id="avoid"
            placeholder="e.g. mushrooms, shellfish"
            value={value.avoid}
            onChange={(e) => onChange({ ...value, avoid: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="calorieTarget">Calorie target (optional)</Label>
          <Input
            id="calorieTarget"
            type="number"
            placeholder="e.g. 700"
            value={value.calorieTarget}
            onChange={(e) => onChange({ ...value, calorieTarget: e.target.value })}
          />
        </div>
      </div>
    </div>
  )
}
