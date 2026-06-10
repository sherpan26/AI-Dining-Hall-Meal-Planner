/**
 * Prompt builders for the AI Dining Concierge recommendation flow.
 *
 * Pure string helpers — no SDK calls — so they're easy to unit test. The route
 * pairs these with `aiRecommendationSchema` (lib/ai/plate-schema.ts) via
 * `generateObject` to get typed plates back.
 */

import { formatMealPeriod, type DiningHall } from "@/lib/dining-halls"
import type { MacroTargets, MacroTotals, MenuItem, RemainingTargets, UserPrefs } from "@/lib/types"

/** Default cap on the number of menu items sent to the model. */
export const DEFAULT_MENU_ITEM_LIMIT = 60

const GOAL_LABELS: Record<UserPrefs["goal"], string> = {
  lose: "lose weight (favor lower-calorie, high-volume, high-protein choices)",
  maintain: "maintain weight (balanced choices)",
  gain: "gain weight (higher-calorie, calorie-dense choices)",
  muscle: "build muscle (higher protein with enough calories to support training)",
  protein: "maximize protein intake",
}

export interface RecommendPromptInput {
  hall: DiningHall
  /** Meal period token or display string (e.g. "Dinner", "Knight+Room"). */
  meal: string
  menuItems: MenuItem[]
  prefs: UserPrefs
  /** Optional estimated daily targets to anchor the meal's macros. */
  macroTargets?: MacroTargets
  /** Optional totals the user has already logged today. */
  todayTotals?: MacroTotals
  /** Optional remaining room for the rest of today (targets − todayTotals; may be negative). */
  remainingTargets?: RemainingTargets
  /** How many meals the user has already logged today. */
  loggedMealCountToday?: number
  /** Optional extra filter labels selected in the UI (e.g. "high-protein"). */
  filters?: string[]
  /** Max menu items to include in the prompt. */
  menuItemLimit?: number
}

/**
 * Render one menu item with any enriched data the provider supplied:
 * `Name (portion) [macros] {dietary tags} (contains allergens)`.
 * Item names are preserved exactly so the model can copy them verbatim.
 */
function itemLine(item: MenuItem): string {
  let line = item.portion ? `${item.name} (${item.portion})` : item.name

  if (item.calories !== undefined) {
    const macros = [`${Math.round(item.calories)} cal`]
    if (item.protein !== undefined) macros.push(`${Math.round(item.protein)}g protein`)
    if (item.carbs !== undefined) macros.push(`${Math.round(item.carbs)}g carbs`)
    if (item.fat !== undefined) macros.push(`${Math.round(item.fat)}g fat`)
    line += ` [${macros.join(", ")}]`
  }
  if (item.dietaryTags?.length) line += ` {${item.dietaryTags.join(", ")}}`
  if (item.allergens?.length) line += ` (contains ${item.allergens.join(", ")})`

  return line
}

/**
 * Summarize a menu into a compact, category-grouped text block, capping the total
 * number of items so the prompt stays small. Item names are preserved exactly so
 * the model can copy them verbatim.
 */
export function summarizeMenu(menuItems: MenuItem[], limit: number = DEFAULT_MENU_ITEM_LIMIT): string {
  if (!menuItems.length) return "(no items available)"

  const byCategory = new Map<string, string[]>()
  let count = 0

  for (const item of menuItems) {
    if (count >= limit) break
    const category = item.category || "Uncategorized"
    const names = byCategory.get(category) ?? []
    names.push(itemLine(item))
    byCategory.set(category, names)
    count++
  }

  const sections: string[] = []
  for (const [category, names] of byCategory) {
    sections.push(`${category}:\n${names.map((n) => `- ${n}`).join("\n")}`)
  }

  const truncated = menuItems.length > count ? `\n\n(…${menuItems.length - count} more items omitted)` : ""
  return sections.join("\n\n") + truncated
}

/** Build the structured-output prompt asking Gemini for 3 plates from the real menu. */
export function buildRecommendationPrompt(input: RecommendPromptInput): string {
  const { hall, meal, menuItems, prefs, macroTargets, todayTotals, remainingTargets, loggedMealCountToday, filters, menuItemLimit } =
    input

  const prefLines: string[] = [
    `- Goal: ${GOAL_LABELS[prefs.goal] ?? prefs.goal}`,
    `- Dietary restrictions: ${prefs.diets.length ? prefs.diets.join(", ") : "none"}`,
    `- Foods to avoid: ${prefs.avoid.length ? prefs.avoid.join(", ") : "none"}`,
  ]
  if (filters?.length) {
    prefLines.push(`- Additional filters: ${filters.join(", ")}`)
  }

  // Anchor the meal to roughly one-third of estimated daily targets.
  let targetLines = ""
  if (macroTargets) {
    const perMeal = (n: number) => Math.round(n / 3)
    targetLines = [
      ``,
      `Estimated daily targets (a single meal should cover roughly one-third):`,
      `- Daily: ~${macroTargets.calories} kcal, ${macroTargets.protein}g protein, ${macroTargets.carbs}g carbs, ${macroTargets.fat}g fat`,
      `- This meal (~1/3): ~${perMeal(macroTargets.calories)} kcal, ${perMeal(macroTargets.protein)}g protein, ${perMeal(
        macroTargets.carbs,
      )}g carbs, ${perMeal(macroTargets.fat)}g fat`,
    ].join("\n")
  }

  // When the user has already logged meals today, the room left for the rest of
  // the day becomes the PRIMARY nutrition context (best *next* meal, not just a
  // generic daily-target meal).
  let remainingLines = ""
  const r = (n: number) => Math.round(n)
  if (remainingTargets && (loggedMealCountToday ?? 0) > 0) {
    remainingLines = [
      ``,
      `Today's progress — the student has already logged ${loggedMealCountToday} meal(s) today:`,
      todayTotals
        ? `- Eaten so far: ~${r(todayTotals.calories)} kcal, ${r(todayTotals.protein)}g protein, ${r(
            todayTotals.carbs,
          )}g carbs, ${r(todayTotals.fat)}g fat`
        : "",
      `- Remaining for the rest of today: ~${r(remainingTargets.calories)} kcal, ${r(remainingTargets.protein)}g protein, ${r(
        remainingTargets.carbs,
      )}g carbs, ${r(remainingTargets.fat)}g fat (a negative value means they are already over that target)`,
      ``,
      `Use these REMAINING targets as the primary nutrition context. Recommend the best next meal for the rest of the student's day:`,
      `- If remaining calories are low, prefer lighter, high-protein, high-volume plates.`,
      `- If remaining protein is high, prioritize protein-dense plates.`,
      `- If remaining carbs or fat are low, avoid plates that heavily exceed those remaining amounts.`,
      `- If the student is already over a target, do NOT shame them — simply recommend balanced options that keep the rest of their day on track.`,
      `- Do not force plates to hit the remaining targets exactly; choose realistic dining hall plates that move the student closer to their goal.`,
    ]
      .filter(Boolean)
      .join("\n")
  }

  const menuSummary = summarizeMenu(menuItems, menuItemLimit)

  return [
    `You are a Rutgers University dining assistant. Recommend exactly 3 meal "plates" for a student eating ${formatMealPeriod(
      meal,
    )} at ${hall.name}.`,
    ``,
    `Student preferences:`,
    prefLines.join("\n"),
    targetLines,
    remainingLines,
    ``,
    `Today's menu (use ONLY these items — do not invent dishes):`,
    menuSummary,
    ``,
    `Rules:`,
    `- Each plate must use 1-6 items, taken verbatim from the menu above.`,
    `- Menu annotations: [..] = per-item macros, {..} = dietary tags, (contains ..) = allergens.`,
    `- STRICTLY exclude any item whose allergens or contents conflict with the user's dietary restrictions or avoid list; prefer items whose dietary tags match the user's diets.`,
    `- When an item lists macros, use those exact values; otherwise estimate. Each plate's totals must sum its items' macros.`,
    remainingLines
      ? `- Bias choices toward the student's goal and, above all, the REMAINING targets for the rest of today.`
      : `- Bias choices toward the student's goal and the per-meal targets above.`,
    `- Each rationale (1-2 sentences) must explain how the plate supports the student's goal.`,
    `- Add concise tags (e.g. "high-protein", "vegetarian") and any relevant allergen/diet warnings.`,
  ].join("\n")
}
