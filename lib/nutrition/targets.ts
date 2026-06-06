/**
 * Lightweight calorie/macro target estimation.
 *
 * IMPORTANT: this is a rough ESTIMATE for general planning only — NOT medical or
 * dietary advice. The numbers it produces should not be treated as clinically
 * precise or as required intake.
 *
 * Methodology (intentionally simplified for MVP use):
 * - When age, height, and weight are provided, it uses a *simplified,
 *   sex-neutral* variant of the Mifflin–St Jeor equation. We use the midpoint of
 *   the male (+5) and female (−161) constants (−78) so we don't have to collect a
 *   sex/gender input. This trades some accuracy for a lighter, more private form.
 * - It multiplies BMR by a coarse activity factor to approximate TDEE, then
 *   applies a flat per-goal calorie delta.
 * - When profile data is missing, it falls back to simple goal-based defaults.
 * - Macro splits are simple per-goal heuristics, not individualized prescriptions.
 *
 * This is deliberately kept lightweight; a more rigorous model is out of scope
 * for the MVP. Do not add sex/gender or other sensitive inputs without a clear
 * reason, and keep any such input optional.
 */

import type { ActivityLevel, Goal, MacroTargets, UserProfile } from "@/lib/types"

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  "very-active": 1.9,
}

/** Daily-calorie defaults per goal when no profile is provided. */
const GOAL_DEFAULT_CALORIES: Record<Goal, number> = {
  maintain: 2200,
  lose: 1800,
  gain: 2600,
  muscle: 2500,
  protein: 2200,
}

/** Calorie adjustment vs. estimated maintenance, per goal. */
const GOAL_CALORIE_DELTA: Record<Goal, number> = {
  maintain: 0,
  lose: -500,
  gain: 400,
  muscle: 250,
  protein: 0,
}

/** Protein grams per kg of bodyweight, per goal (used when weight is known). */
const GOAL_PROTEIN_PER_KG: Record<Goal, number> = {
  maintain: 1.6,
  lose: 1.8,
  gain: 1.8,
  muscle: 2.0,
  protein: 2.0,
}

/** Fallback macro split (fraction of calories) per goal, used when weight is unknown. */
const GOAL_MACRO_SPLIT: Record<Goal, { protein: number; fat: number }> = {
  maintain: { protein: 0.3, fat: 0.3 },
  lose: { protein: 0.35, fat: 0.3 },
  gain: { protein: 0.25, fat: 0.25 },
  muscle: { protein: 0.35, fat: 0.25 },
  protein: { protein: 0.4, fat: 0.25 },
}

/** True if the profile has enough data to compute a BMR-based estimate. */
export function hasProfileForCalc(profile?: UserProfile): boolean {
  return Boolean(profile?.age && profile?.heightCm && profile?.weightKg)
}

/**
 * Estimate daily calorie and macro targets.
 *
 * Priority: manual calorie override → profile-based (Mifflin–St Jeor) → goal default.
 */
export function estimateTargets(goal: Goal, profile?: UserProfile, manualCalories?: number): MacroTargets {
  let calories: number
  let source: MacroTargets["source"]

  if (manualCalories && manualCalories > 0) {
    calories = Math.round(manualCalories)
    source = "manual"
  } else if (hasProfileForCalc(profile) && profile) {
    // Sex-neutral Mifflin–St Jeor (constant midpoint of +5 / -161).
    const bmr = 10 * profile.weightKg! + 6.25 * profile.heightCm! - 5 * profile.age! - 78
    const tdee = bmr * ACTIVITY_FACTORS[profile.activity ?? "moderate"]
    calories = Math.round(tdee + GOAL_CALORIE_DELTA[goal])
    source = "calculated"
  } else {
    calories = GOAL_DEFAULT_CALORIES[goal]
    source = "calculated"
  }

  // Protein: prefer per-kg when weight is known, else a calorie-share fallback.
  const split = GOAL_MACRO_SPLIT[goal]
  const proteinG =
    profile?.weightKg && profile.weightKg > 0
      ? Math.round(profile.weightKg * GOAL_PROTEIN_PER_KG[goal])
      : Math.round((calories * split.protein) / 4)

  const fatG = Math.round((calories * split.fat) / 9)
  const remainingCalories = calories - proteinG * 4 - fatG * 9
  const carbsG = Math.max(0, Math.round(remainingCalories / 4))

  return {
    calories,
    protein: Math.max(0, proteinG),
    carbs: carbsG,
    fat: Math.max(0, fatG),
    source,
  }
}
