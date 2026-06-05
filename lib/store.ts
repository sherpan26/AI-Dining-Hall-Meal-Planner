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
import { DEFAULT_USER_PREFS, type SavedPlate, type UserPrefs } from "@/lib/types"

/** localStorage keys owned by this module. */
export const STORAGE_KEYS = {
  prefs: "ru-dining:prefs",
  savedPlates: "ru-dining:saved-plates",
} as const

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
