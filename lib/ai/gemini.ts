/**
 * Minimal Gemini provider helper for the new recommendation flow.
 *
 * Uses `createGoogleGenerativeAI({ apiKey })`, which is the correct pattern for the
 * installed @ai-sdk/google (v3): the per-call `apiKey` option used by the older call
 * sites is no longer honored. Key rotation is reused from `lib/api-key-rotation.ts`.
 *
 * Scope note: this is additive. Existing AI call sites are intentionally NOT changed
 * in this step.
 */

import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { getNextApiKey } from "@/lib/api-key-rotation"

// Model selection (free-tier reality on current keys):
//  - `gemini-2.0-flash` / `-lite`: 429, free-tier quota is 0 — unusable.
//  - `gemini-1.5-flash`: 404, no longer served on v1beta.
//  - `gemini-2.5-flash`: works, but intermittently 503s under demand.
//  - `gemini-2.5-flash-lite`: works and is consistently available — our default.
// Override with GOOGLE_GENERATIVE_AI_MODEL if you have access to a better model.
export const DEFAULT_GEMINI_MODEL = process.env.GOOGLE_GENERATIVE_AI_MODEL || "gemini-2.5-flash-lite"

/** Names of the env vars the app reads for Gemini keys (kept in sync with api-key-rotation). */
const GEMINI_KEY_ENV_VARS = [
  "GOOGLE_GENERATIVE_AI_API_KEY",
  "GOOGLE_GENERATIVE_AI_API_KEY_2",
  "GOOGLE_GENERATIVE_AI_API_KEY_3",
  "GOOGLE_GENERATIVE_AI_API_KEY_4",
  "GOOGLE_GENERATIVE_AI_API_KEY_5",
] as const

/** True if at least one Gemini API key is configured. */
export function hasGeminiKey(): boolean {
  return GEMINI_KEY_ENV_VARS.some((name) => (process.env[name] ?? "").length > 0)
}

/**
 * Returns a Gemini model bound to the next rotated API key.
 * Throws if no key is configured — callers should check `hasGeminiKey()` first
 * for a clean user-facing error.
 */
export function getGeminiModel(modelName: string = DEFAULT_GEMINI_MODEL) {
  const apiKey = getNextApiKey()
  if (!apiKey) {
    throw new Error("No Gemini API key configured")
  }
  const google = createGoogleGenerativeAI({ apiKey })
  return google(modelName)
}
