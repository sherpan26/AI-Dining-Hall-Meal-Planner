/**
 * Local-date helpers for grouping logged meals by the user's calendar day.
 * Uses the local timezone (not UTC) so a meal logged at 11pm counts for "today".
 */

/** Local date as "YYYY-MM-DD". */
export function getLocalDateKey(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/** True if a "YYYY-MM-DD" key is the user's local today. */
export function isToday(dateKey: string): boolean {
  return dateKey === getLocalDateKey()
}

/** Human label for a date key, e.g. "June 9, 2026". */
export function formatDateLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number)
  if (!y || !m || !d) return dateKey
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}
