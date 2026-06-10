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
import { DEFAULT_GEMINI_MODEL, getGeminiModel, hasGeminiKey } from "@/lib/ai/gemini"
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
  // Optional enriched fields (Nutrislice). Preserved so the prompt can use them.
  calories: z.number().optional(),
  protein: z.number().optional(),
  carbs: z.number().optional(),
  fat: z.number().optional(),
  allergens: z.array(z.string()).optional(),
  dietaryTags: z.array(z.string()).optional(),
  source: z.enum(["nutrislice", "foodpro"]).optional(),
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

/** Plain calorie/macro totals (today's logged totals / remaining room). May be negative. */
const macroTotalsSchema = z.object({
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
})

const requestSchema = z.object({
  /** Hall id ("busch") or display name ("Busch Dining Hall"). */
  hall: z.string().min(1),
  meal: z.string().min(1),
  menuItems: z.array(menuItemSchema).default([]),
  userPrefs: userPrefsSchema.optional(),
  macroTargets: macroTargetsSchema.optional(),
  filters: z.array(z.string()).optional(),
  // Optional "remaining day" context — older clients omit these.
  todayTotals: macroTotalsSchema.optional(),
  remainingTargets: macroTotalsSchema.optional(),
  loggedMealCountToday: z.number().int().nonnegative().optional(),
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
  const { hall: hallKey, meal, menuItems, userPrefs, macroTargets, filters, todayTotals, remainingTargets, loggedMealCountToday } =
    parsed.data

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
    todayTotals,
    remainingTargets,
    loggedMealCountToday,
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
    // Log only safe fields. NOTE: never log the whole error or its `url`, which
    // for Google API calls can contain the API key as a query param.
    const err = error as { name?: string; message?: string; statusCode?: number; status?: number }
    const debug = {
      keyPresent: hasGeminiKey(),
      model: DEFAULT_GEMINI_MODEL,
      menuItems: menuItems.length,
      hasMacroTargets: Boolean(macroTargets),
      errorName: err?.name,
      errorMessage: err?.message,
      status: err?.statusCode ?? err?.status,
    }
    console.error("[recommend] generateObject failed:", debug)

    // Surface details in development only; keep production errors generic.
    const isDev = process.env.NODE_ENV !== "production"
    return jsonError("Failed to generate recommendations", 502, isDev ? debug : undefined)
  }
}
