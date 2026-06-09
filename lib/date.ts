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

// ---------------------------------------------------------------------------
// Calendar math (used by the Daily Log month view) — all local-time, no UTC.
// ---------------------------------------------------------------------------

/** Parse a "YYYY-MM-DD" key into a local Date at midnight. */
export function parseDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number)
  return new Date(y || 1970, (m || 1) - 1, d || 1)
}

/** First day of the month containing `date`. */
export function getStartOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

/** Last day of the month containing `date`. */
export function getEndOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

/** `date` shifted by `n` whole months (n may be negative); anchored to the 1st. */
export function addMonths(date: Date, n: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + n, 1)
}

/** True if two dates fall in the same calendar month and year. */
export function sameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

/** True if two date keys refer to the same day. */
export function isSameDateKey(a: string, b: string): boolean {
  return a === b
}

/** Month + year label, e.g. "June 2026". */
export function getMonthLabel(date: Date): string {
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" })
}

/** Weekday header labels, Sunday-first. */
export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const

/**
 * The 42 days (6 weeks) of a month-view grid containing `date`, starting on the
 * Sunday on/before the 1st. Includes leading/trailing days from adjacent months
 * so the grid is always a full rectangle.
 */
export function getMonthGridDays(date: Date): Date[] {
  const start = getStartOfMonth(date)
  const firstWeekday = start.getDay() // 0 = Sunday
  const gridStart = new Date(start.getFullYear(), start.getMonth(), 1 - firstWeekday)
  const days: Date[] = []
  for (let i = 0; i < 42; i++) {
    days.push(new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i))
  }
  return days
}
