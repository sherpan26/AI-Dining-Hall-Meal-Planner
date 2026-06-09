import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Common dining acronyms to keep uppercase when prettifying shouty names. */
const KEEP_UPPER = new Set(["BBQ", "BLT", "PB", "PBJ", "NY", "GF", "DF", "II", "III", "IV"])

/**
 * Tidy a menu/food name for display: strip `&nbsp;`/extra whitespace and convert
 * ALL-CAPS ("CHICKEN BROTH WITH LEMON") to Title Case, while leaving names that
 * are already mixed-case untouched. Purely cosmetic.
 */
export function formatFoodName(name: string): string {
  const cleaned = name.replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim()
  if (!cleaned) return cleaned

  const letters = cleaned.replace(/[^a-zA-Z]/g, "")
  const isShouty = letters.length > 0 && letters === letters.toUpperCase()
  if (!isShouty) return cleaned

  return cleaned
    .toLowerCase()
    .split(" ")
    .map((word) => {
      if (KEEP_UPPER.has(word.toUpperCase())) return word.toUpperCase()
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(" ")
}
