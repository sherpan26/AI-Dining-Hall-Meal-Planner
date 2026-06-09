/**
 * Shared domain types for the "AI Dining Concierge" redesign.
 *
 * These are foundation types for upcoming work (structured AI output, the new
 * recommendation flow, preferences, and saved plates). Nothing imports them yet,
 * so adding this file changes no behavior. Where practical they stay compatible
 * with shapes already used by the current components/routes.
 */

import type { DiningHallId, MealPeriodToken } from "@/lib/dining-halls"
import type { RecommendedPlate } from "@/lib/ai/plate-schema"

// Re-export hall types so consumers can import all domain types from one place.
export type { DiningHall, DiningHallId, MealPeriodToken } from "@/lib/dining-halls"

/** A meal period as shown to users ("Knight Room") or as a raw token ("Knight+Room"). */
export type MealPeriod = MealPeriodToken | string

// ---------------------------------------------------------------------------
// Menu data (from scraping the Rutgers FoodPro site)
// ---------------------------------------------------------------------------

/**
 * A single item on a dining hall menu. Compatible with the shape currently
 * returned by `app/api/menu/route.ts` and consumed by the existing components.
 */
export interface MenuItem {
  name: string
  category: string
  portion: string
  /** Link to the FoodPro nutrition-label page, when available. */
  nutritionLink: string | null

  // --- Optional enriched data (currently provided by Nutrislice) ---
  /** Per-item macros, when the provider supplies them. */
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  /** Allergens the item contains, e.g. ["Milk", "Wheat"]. */
  allergens?: string[]
  /** Dietary tags, e.g. ["Vegetarian", "Vegan"]. */
  dietaryTags?: string[]
  /** Which provider supplied this item. */
  source?: MenuSource
}

/** Which provider supplied the menu data. */
export type MenuSource = "nutrislice" | "foodpro"

/** Menu for one hall + meal period + date, grouped for convenient rendering. */
export interface MenuData {
  diningHall: string
  date: string
  mealPeriod: string
  menuItems: MenuItem[]
  menuByCategory: Record<string, MenuItem[]>
  timestamp: string
  /** Provider that produced the items, or null if none returned data. */
  source?: MenuSource | null
  error?: string
}

// ---------------------------------------------------------------------------
// Nutrition
// ---------------------------------------------------------------------------

/**
 * Normalized, numeric nutrition for the new flow. The scraping layer produces
 * raw strings (see `RawNutritionLabel`); this is the cleaned shape the AI and UI use.
 */
export interface NutritionInfo {
  calories: number
  protein: number
  carbs: number
  fat: number
  /** Allergens parsed from the label, when available. */
  allergens?: string[]
}

/**
 * Raw nutrition label as scraped (all string fields). Mirrors the `NutritionData`
 * interface currently in `app/api/nutrition/route.ts` for future consolidation.
 */
export interface RawNutritionLabel {
  itemName: string
  servingSize: string
  calories: string
  totalFat: string
  saturatedFat: string
  transFat: string
  cholesterol: string
  sodium: string
  totalCarbs: string
  dietaryFiber: string
  sugars: string
  protein: string
  ingredients: string
  allergens: string
  percentDailyValues: Record<string, string>
}

// ---------------------------------------------------------------------------
// Plates (AI recommendations)
// ---------------------------------------------------------------------------

/** One food item within a recommended plate, with its estimated nutrition. */
export interface PlateItem {
  name: string
  nutrition: NutritionInfo
}

/** A recommended meal ("plate") assembled by the AI from a real menu. */
export interface Plate {
  id: string
  title: string
  /** Hall id this plate was built from. */
  hall: DiningHallId
  /** Meal period this plate was built for (token or display string). */
  meal: MealPeriod
  items: PlateItem[]
  /** Summed nutrition across all items. */
  totals: NutritionInfo
  /** Short AI explanation of why this plate fits the user's goal. */
  rationale: string
}

/**
 * A plate the user saved to local storage. Based on the AI's `RecommendedPlate`
 * shape (the thing actually saved), with a timestamp.
 */
export interface SavedPlate extends RecommendedPlate {
  /** Epoch millis when saved. */
  savedAt: number
}

// ---------------------------------------------------------------------------
// Logged meals (Daily Log — what the user actually ate)
// ---------------------------------------------------------------------------

/** Plain calorie/macro totals (no source metadata). */
export interface MacroTotals {
  calories: number
  protein: number
  carbs: number
  fat: number
}

/**
 * A meal the user actually ate, counted toward their daily nutrition.
 * Distinct from `SavedPlate` (a bookmark for later).
 */
export interface LoggedMeal {
  id: string
  /** The recommended plate this came from, if any. */
  plateId?: string
  title: string
  hall: string
  meal: string
  /** Local date "YYYY-MM-DD" the meal counts toward. */
  date: string
  /** ISO timestamp when it was logged. */
  loggedAt: string
  items: PlateItem[]
  totals: MacroTotals
  tags?: string[]
  warnings?: string[]
}

// ---------------------------------------------------------------------------
// User preferences
// ---------------------------------------------------------------------------

/** Fitness/eating goal that biases recommendations. */
export type Goal = "maintain" | "lose" | "gain" | "muscle" | "protein"

/** Dietary filters the user can opt into. */
export type Diet = "vegetarian" | "vegan" | "halal" | "gluten-free"

/** Self-reported activity level, used to estimate energy needs. */
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very-active"

/** Optional, lightweight profile used to refine calorie/macro estimates. */
export interface UserProfile {
  age?: number
  heightCm?: number
  weightKg?: number
  activity?: ActivityLevel
}

/** Where a calorie/macro target came from. */
export type TargetSource = "manual" | "calculated"

/** Estimated daily nutrition targets (an estimate, not medical advice). */
export interface MacroTargets {
  calories: number
  protein: number
  carbs: number
  fat: number
  source: TargetSource
}

/** Persisted user preferences (stored locally; no account required). */
export interface UserPrefs {
  goal: Goal
  diets: Diet[]
  /** Free-text foods to avoid, e.g. ["mushrooms", "shellfish"]. */
  avoid: string[]
  /** Optional manual daily calorie target — overrides any calculated target. */
  calorieTarget?: number
  /** Optional lightweight profile for better estimates. */
  profile?: UserProfile
}

/** Default preferences for a first-time user. */
export const DEFAULT_USER_PREFS: UserPrefs = {
  goal: "maintain",
  diets: [],
  avoid: [],
}
