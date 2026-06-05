/**
 * POST /api/recommend
 *
 * New, independent recommendation endpoint for the AI Dining Concierge. Takes a
 * hall + meal + the real menu items + the user's preferences and returns 1-3
 * typed plate recommendations via Gemini structured output (Zod validated).
 *
 * Independent from /api/chat and /api/chat/direct — those are untouched.
 */

import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"
import { generateObject } from "ai"
import { z } from "zod"
import { getDiningHallById, getDiningHallByName } from "@/lib/dining-halls"
import { getGeminiModel, hasGeminiKey } from "@/lib/ai/gemini"
import { aiRecommendationSchema, type RecommendedPlate } from "@/lib/ai/plate-schema"
import { buildRecommendationPrompt } from "@/lib/ai/prompts"
import type { MenuItem, UserPrefs } from "@/lib/types"

export const runtime = "nodejs"

// --- Request validation -----------------------------------------------------

const menuItemSchema = z.object({
  name: z.string().min(1),
  category: z.string().optional().default("Uncategorized"),
  portion: z.string().optional().default(""),
  nutritionLink: z.string().nullable().optional().default(null),
})

const userPrefsSchema = z.object({
  goal: z.enum(["lose", "maintain", "gain", "muscle", "protein"]).default("maintain"),
  diets: z.array(z.string()).default([]),
  avoid: z.array(z.string()).default([]),
  calorieTarget: z.number().optional(),
})

const macroTargetsSchema = z.object({
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  source: z.enum(["manual", "calculated"]),
})

const requestSchema = z.object({
  /** Hall id ("busch") or display name ("Busch Dining Hall"). */
  hall: z.string().min(1),
  meal: z.string().min(1),
  menuItems: z.array(menuItemSchema).default([]),
  userPrefs: userPrefsSchema.optional(),
  macroTargets: macroTargetsSchema.optional(),
  filters: z.array(z.string()).optional(),
})

function jsonError(message: string, status: number, details?: unknown) {
  return NextResponse.json({ error: message, ...(details ? { details } : {}) }, { status })
}

// --- Handler ----------------------------------------------------------------

export async function POST(req: Request) {
  // 1. Parse + validate body.
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return jsonError("Invalid JSON body", 400)
  }

  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return jsonError("Invalid request", 400, parsed.error.flatten())
  }
  const { hall: hallKey, meal, menuItems, userPrefs, macroTargets, filters } = parsed.data

  // 2. Resolve the dining hall (accept id or display name).
  const hall = getDiningHallById(hallKey) ?? getDiningHallByName(hallKey)
  if (!hall) {
    return jsonError(`Unknown dining hall: "${hallKey}"`, 400)
  }

  // 3. Reject empty menus early (nothing to recommend from).
  if (menuItems.length === 0) {
    return jsonError("No menu items provided for this hall/meal", 400)
  }

  // 4. Ensure a key is configured before calling the model.
  if (!hasGeminiKey()) {
    return jsonError("AI is not configured (missing Gemini API key)", 503)
  }

  const prefs: UserPrefs = {
    goal: userPrefs?.goal ?? "maintain",
    diets: (userPrefs?.diets ?? []) as UserPrefs["diets"],
    avoid: userPrefs?.avoid ?? [],
    calorieTarget: userPrefs?.calorieTarget,
  }

  const prompt = buildRecommendationPrompt({
    hall,
    meal,
    menuItems: menuItems as MenuItem[],
    prefs,
    macroTargets,
    filters,
  })

  // 5. Call Gemini with structured output.
  try {
    const { object } = await generateObject({
      model: getGeminiModel(),
      schema: aiRecommendationSchema,
      prompt,
      temperature: 0.7,
    })

    // 6. Attach deterministic fields server-side.
    const plates: RecommendedPlate[] = object.plates.map((draft) => ({
      ...draft,
      id: randomUUID(),
      hall: hall.id,
      meal,
    }))

    return NextResponse.json({ plates })
  } catch (error) {
    console.error("Error in /api/recommend:", error)
    return jsonError("Failed to generate recommendations", 502)
  }
}
