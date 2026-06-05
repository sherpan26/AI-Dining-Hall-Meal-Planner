/**
 * Prompt builders for the AI Dining Concierge recommendation flow.
 *
 * Pure string helpers — no SDK calls — so they're easy to unit test. The route
 * pairs these with `aiRecommendationSchema` (lib/ai/plate-schema.ts) via
 * `generateObject` to get typed plates back.
 */

import { formatMealPeriod, type DiningHall } from "@/lib/dining-halls"
import type { MenuItem, UserPrefs } from "@/lib/types"

/** Default cap on the number of menu items sent to the model. */
export const DEFAULT_MENU_ITEM_LIMIT = 60

const GOAL_LABELS: Record<UserPrefs["goal"], string> = {
  lose: "lose weight (favor lower-calorie, high-volume, high-protein choices)",
  maintain: "maintain weight (balanced choices)",
  gain: "gain weight (higher-calorie, calorie-dense choices)",
  protein: "maximize protein intake",
}

export interface RecommendPromptInput {
  hall: DiningHall
  /** Meal period token or display string (e.g. "Dinner", "Knight+Room"). */
  meal: string
  menuItems: MenuItem[]
  prefs: UserPrefs
  /** Optional extra filter labels selected in the UI (e.g. "high-protein"). */
  filters?: string[]
  /** Max menu items to include in the prompt. */
  menuItemLimit?: number
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
    const label = item.portion ? `${item.name} (${item.portion})` : item.name
    names.push(label)
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
  const { hall, meal, menuItems, prefs, filters, menuItemLimit } = input

  const prefLines: string[] = [
    `- Goal: ${GOAL_LABELS[prefs.goal] ?? prefs.goal}`,
    `- Dietary restrictions: ${prefs.diets.length ? prefs.diets.join(", ") : "none"}`,
    `- Foods to avoid: ${prefs.avoid.length ? prefs.avoid.join(", ") : "none"}`,
  ]
  if (typeof prefs.calorieTarget === "number") {
    prefLines.push(`- Approx. calorie target for this meal: ${prefs.calorieTarget}`)
  }
  if (filters?.length) {
    prefLines.push(`- Additional filters: ${filters.join(", ")}`)
  }

  const menuSummary = summarizeMenu(menuItems, menuItemLimit)

  return [
    `You are a Rutgers University dining assistant. Recommend exactly 3 meal "plates" for a student eating ${formatMealPeriod(
      meal,
    )} at ${hall.name}.`,
    ``,
    `Student preferences:`,
    prefLines.join("\n"),
    ``,
    `Today's menu (use ONLY these items — do not invent dishes):`,
    menuSummary,
    ``,
    `Rules:`,
    `- Each plate must use 1-6 items, taken verbatim from the menu above.`,
    `- Respect the dietary restrictions and avoid list strictly.`,
    `- Estimate realistic nutrition (calories/protein/carbs/fat) for each item and provide accurate plate totals.`,
    `- Bias choices toward the student's goal.`,
    `- Add concise tags (e.g. "high-protein", "vegetarian") and any relevant allergen/diet warnings.`,
    `- Keep each rationale to 1-2 sentences.`,
  ].join("\n")
}
