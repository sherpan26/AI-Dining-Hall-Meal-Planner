/**
 * Zod schemas for structured AI plate recommendations.
 *
 * Replaces the old approach of generating markdown and parsing it with regex.
 * The model returns typed JSON validated against these schemas, so the UI can
 * render real data instead of re-parsing prose.
 *
 * Design: the model only generates the *content* of each plate (title, items,
 * totals, rationale, tags, warnings). Deterministic fields (`id`, `hall`, `meal`)
 * are attached server-side in the route — we don't trust the LLM to echo them.
 */

import { z } from "zod"

/** Numeric nutrition, mirrors `NutritionInfo` in lib/types.ts. */
export const nutritionSchema = z.object({
  calories: z.number().describe("Estimated calories"),
  protein: z.number().describe("Protein in grams"),
  carbs: z.number().describe("Carbohydrates in grams"),
  fat: z.number().describe("Fat in grams"),
})

/** One food item on a plate, mirrors `PlateItem` in lib/types.ts. */
export const plateItemSchema = z.object({
  name: z.string().describe("Exact item name, copied from the provided menu"),
  nutrition: nutritionSchema,
})

/** The part of a plate the AI generates. */
export const plateDraftSchema = z.object({
  title: z.string().describe("Short, appealing name for the plate"),
  items: z.array(plateItemSchema).min(1).describe("1-6 items, ALL taken from the provided menu"),
  totals: nutritionSchema.describe("Sum of the items' nutrition"),
  rationale: z.string().describe("1-2 sentences on why this plate fits the user's goal and diet"),
  tags: z.array(z.string()).describe("Short labels, e.g. 'high-protein', 'vegetarian', 'under-700-cal'"),
  warnings: z.array(z.string()).describe("Allergen or dietary warnings; empty array if none"),
})

/** What `generateObject` returns: 1-3 plate drafts. */
export const aiRecommendationSchema = z.object({
  plates: z.array(plateDraftSchema).min(1).max(3),
})

/** Canonical plate after the server attaches id/hall/meal. */
export const plateSchema = plateDraftSchema.extend({
  id: z.string(),
  /** Dining hall id (e.g. "busch"). */
  hall: z.string(),
  /** Meal period the plate was built for (token or display string). */
  meal: z.string(),
})

/** The full response body of `POST /api/recommend`. */
export const recommendationResponseSchema = z.object({
  plates: z.array(plateSchema),
})

// Inferred TypeScript types.
export type PlateNutrition = z.infer<typeof nutritionSchema>
export type AiPlateItem = z.infer<typeof plateItemSchema>
export type PlateDraft = z.infer<typeof plateDraftSchema>
export type AiRecommendation = z.infer<typeof aiRecommendationSchema>
export type RecommendedPlate = z.infer<typeof plateSchema>
export type RecommendationResponse = z.infer<typeof recommendationResponseSchema>
