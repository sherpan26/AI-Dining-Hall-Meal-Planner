/**
 * Typed, SSR-safe localStorage helpers and React hooks for the redesign.
 *
 * - All access is guarded against `window`/`localStorage` being undefined (SSR).
 * - JSON parsing is wrapped so corrupt/legacy values fall back to a default
 *   instead of throwing.
 * - Hooks keep React state in sync with localStorage and across tabs via the
 *   native `storage` event.
 *
 * Foundation only — nothing imports this yet, so it changes no behavior.
 */

import { useCallback, useEffect, useState } from "react"
import {
  DEFAULT_USER_PREFS,
  type LoggedMeal,
  type MacroTotals,
  type SavedPlate,
  type UserPrefs,
} from "@/lib/types"
import type { RecommendedPlate } from "@/lib/ai/plate-schema"
import { getLocalDateKey } from "@/lib/date"

/** localStorage keys owned by this module. */
export const STORAGE_KEYS = {
  prefs: "ru-dining:prefs",
  savedPlates: "ru-dining:saved-plates",
  loggedMeals: "ru-dining:logged-meals",
} as const

/** Browser-safe unique id. */
function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

const EMPTY_TOTALS: MacroTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 }

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

/** Read and JSON-parse a value, returning `fallback` on missing/corrupt data. */
export function readStorage<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

/** JSON-serialize and write a value. No-ops on the server; swallows quota errors. */
export function writeStorage<T>(key: string, value: T): void {
  if (!isBrowser()) return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore (e.g. storage full or disabled) — persistence is best-effort.
  }
}

/** Remove a key. No-ops on the server. */
export function removeStorage(key: string): void {
  if (!isBrowser()) return
  try {
    window.localStorage.removeItem(key)
  } catch {
    // Ignore.
  }
}

/**
 * Generic localStorage-backed state hook.
 *
 * Starts from `defaultValue` on first render (so server and client markup match),
 * then hydrates from localStorage in an effect, and keeps in sync across tabs.
 */
function useLocalStorageState<T>(key: string, defaultValue: T): [T, (next: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(defaultValue)

  // Hydrate from storage after mount to avoid SSR hydration mismatches.
  useEffect(() => {
    setValue(readStorage<T>(key, defaultValue))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  // Keep multiple tabs in sync.
  useEffect(() => {
    if (!isBrowser()) return
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) setValue(readStorage<T>(key, defaultValue))
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next
        writeStorage(key, resolved)
        return resolved
      })
    },
    [key],
  )

  return [value, set]
}

// ---------------------------------------------------------------------------
// User preferences
// ---------------------------------------------------------------------------

export interface UsePrefsResult {
  prefs: UserPrefs
  setPrefs: (next: UserPrefs | ((prev: UserPrefs) => UserPrefs)) => void
  /** Merge a partial update into the existing preferences. */
  updatePrefs: (patch: Partial<UserPrefs>) => void
  resetPrefs: () => void
}

/** Read/write the user's preferences from localStorage. */
export function usePrefs(): UsePrefsResult {
  const [prefs, setPrefs] = useLocalStorageState<UserPrefs>(STORAGE_KEYS.prefs, DEFAULT_USER_PREFS)

  const updatePrefs = useCallback(
    (patch: Partial<UserPrefs>) => setPrefs((prev) => ({ ...prev, ...patch })),
    [setPrefs],
  )

  const resetPrefs = useCallback(() => setPrefs(DEFAULT_USER_PREFS), [setPrefs])

  return { prefs, setPrefs, updatePrefs, resetPrefs }
}

// ---------------------------------------------------------------------------
// Saved plates
// ---------------------------------------------------------------------------

export interface UseSavedPlatesResult {
  savedPlates: SavedPlate[]
  /** Save a plate (adds `savedAt`). Replaces any existing plate with the same id. */
  savePlate: (plate: Omit<SavedPlate, "savedAt">) => void
  removePlate: (id: string) => void
  isSaved: (id: string) => boolean
  clearSaved: () => void
}

/** Read/write the user's saved plates from localStorage. */
export function useSavedPlates(): UseSavedPlatesResult {
  const [savedPlates, setSavedPlates] = useLocalStorageState<SavedPlate[]>(STORAGE_KEYS.savedPlates, [])

  const savePlate = useCallback(
    (plate: Omit<SavedPlate, "savedAt">) => {
      setSavedPlates((prev) => {
        const withoutDup = prev.filter((p) => p.id !== plate.id)
        return [{ ...plate, savedAt: Date.now() }, ...withoutDup]
      })
    },
    [setSavedPlates],
  )

  const removePlate = useCallback(
    (id: string) => setSavedPlates((prev) => prev.filter((p) => p.id !== id)),
    [setSavedPlates],
  )

  const isSaved = useCallback((id: string) => savedPlates.some((p) => p.id === id), [savedPlates])

  const clearSaved = useCallback(() => setSavedPlates([]), [setSavedPlates])

  return { savedPlates, savePlate, removePlate, isSaved, clearSaved }
}

// ---------------------------------------------------------------------------
// Logged meals (Daily Log)
// ---------------------------------------------------------------------------

/** Metadata captured at log time (the hall/meal the plate came from). */
export interface LogMealMeta {
  hall: string
  meal: string
}

export interface UseLoggedMealsResult {
  loggedMeals: LoggedMeal[]
  /** Log a recommended plate as eaten today. Allows duplicates intentionally. */
  logMeal: (plate: RecommendedPlate, meta: LogMealMeta) => LoggedMeal
  removeLoggedMeal: (id: string) => void
  clearLoggedMealsForDate: (date: string) => void
  getMealsForDate: (date: string) => LoggedMeal[]
  getTodayMeals: () => LoggedMeal[]
  getTotalsForDate: (date: string) => MacroTotals
  /** Distinct date keys that have at least one logged meal, most recent first. */
  getDatesWithMeals: () => string[]
  /** Number of meals logged on a given date key. */
  getMealCountForDate: (date: string) => number
}

/** Read/write the user's logged (eaten) meals from localStorage. */
export function useLoggedMeals(): UseLoggedMealsResult {
  const [loggedMeals, setLoggedMeals] = useLocalStorageState<LoggedMeal[]>(STORAGE_KEYS.loggedMeals, [])

  const logMeal = useCallback(
    (plate: RecommendedPlate, meta: LogMealMeta) => {
      const entry: LoggedMeal = {
        id: newId(),
        plateId: plate.id,
        title: plate.title,
        hall: meta.hall,
        meal: meta.meal,
        date: getLocalDateKey(),
        loggedAt: new Date().toISOString(),
        items: plate.items,
        totals: {
          calories: plate.totals.calories,
          protein: plate.totals.protein,
          carbs: plate.totals.carbs,
          fat: plate.totals.fat,
        },
        tags: plate.tags,
        warnings: plate.warnings,
      }
      setLoggedMeals((prev) => [entry, ...prev])
      return entry
    },
    [setLoggedMeals],
  )

  const removeLoggedMeal = useCallback(
    (id: string) => setLoggedMeals((prev) => prev.filter((m) => m.id !== id)),
    [setLoggedMeals],
  )

  const clearLoggedMealsForDate = useCallback(
    (date: string) => setLoggedMeals((prev) => prev.filter((m) => m.date !== date)),
    [setLoggedMeals],
  )

  const getMealsForDate = useCallback(
    (date: string) => loggedMeals.filter((m) => m.date === date),
    [loggedMeals],
  )

  const getTodayMeals = useCallback(
    () => loggedMeals.filter((m) => m.date === getLocalDateKey()),
    [loggedMeals],
  )

  const getTotalsForDate = useCallback(
    (date: string) =>
      loggedMeals
        .filter((m) => m.date === date)
        .reduce<MacroTotals>(
          (acc, m) => ({
            calories: acc.calories + m.totals.calories,
            protein: acc.protein + m.totals.protein,
            carbs: acc.carbs + m.totals.carbs,
            fat: acc.fat + m.totals.fat,
          }),
          { ...EMPTY_TOTALS },
        ),
    [loggedMeals],
  )

  const getDatesWithMeals = useCallback(
    () => Array.from(new Set(loggedMeals.map((m) => m.date))).sort().reverse(),
    [loggedMeals],
  )

  const getMealCountForDate = useCallback(
    (date: string) => loggedMeals.reduce((n, m) => (m.date === date ? n + 1 : n), 0),
    [loggedMeals],
  )

  return {
    loggedMeals,
    logMeal,
    removeLoggedMeal,
    clearLoggedMealsForDate,
    getMealsForDate,
    getTodayMeals,
    getTotalsForDate,
    getDatesWithMeals,
    getMealCountForDate,
  }
}
