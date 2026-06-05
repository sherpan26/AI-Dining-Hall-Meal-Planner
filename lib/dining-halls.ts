/**
 * Single source of truth for Rutgers dining hall configuration.
 *
 * This consolidates the `DINING_HALLS` object that is currently duplicated across
 * several components and API routes. Values (locationNum, locationName, baseUrl
 * casing, meal periods) are preserved exactly to stay drop-in compatible with the
 * existing menu-scraping logic.
 *
 * NOTE: nothing imports this yet — it is foundation for the redesign. The existing
 * inline copies are intentionally left untouched for now.
 */

export interface DiningHall {
  /** Stable, URL-safe identifier used by the new UI/routing. */
  id: DiningHallId
  /** Human-readable name shown in selectors. */
  name: string
  /** Base FoodPro endpoint (casing preserved per hall, exactly as the live site uses). */
  baseUrl: string
  /** FoodPro location number, e.g. "04". */
  locationNum: string
  /** FoodPro location name token (uses "+" for spaces), e.g. "Busch+Dining+Hall". */
  locationName: string
  /** Meal-period tokens supported by this hall (FoodPro `activeMeal` values). */
  mealPeriods: readonly MealPeriodToken[]
}

/** Stable slugs for each hall. */
export type DiningHallId = "busch" | "livingston" | "atrium" | "neilson"

/**
 * Meal-period tokens as the FoodPro endpoint expects them (spaces encoded as "+").
 * Not every hall offers every period — see each hall's `mealPeriods`.
 */
export type MealPeriodToken = "Breakfast" | "Lunch" | "Dinner" | "Knight+Room" | "Late+Night"

const FOODPRO_LOWER = "https://menuportal23.dining.rutgers.edu/foodpronet/pickmenu.aspx"
const FOODPRO_UPPER = "https://menuportal23.dining.rutgers.edu/FoodPronet/pickmenu.aspx"

/** Ordered list of dining halls — the canonical source for selectors and iteration. */
export const DINING_HALLS: readonly DiningHall[] = [
  {
    id: "busch",
    name: "Busch Dining Hall",
    baseUrl: FOODPRO_LOWER,
    locationNum: "04",
    locationName: "Busch+Dining+Hall",
    mealPeriods: ["Breakfast", "Lunch", "Dinner", "Knight+Room"],
  },
  {
    id: "livingston",
    name: "Livingston Dining Commons",
    baseUrl: FOODPRO_LOWER,
    locationNum: "03",
    locationName: "Livingston+Dining+Commons",
    mealPeriods: ["Breakfast", "Lunch", "Dinner", "Knight+Room"],
  },
  {
    id: "atrium",
    name: "The Atrium",
    baseUrl: FOODPRO_UPPER,
    locationNum: "13",
    locationName: "The+Atrium",
    mealPeriods: ["Breakfast", "Lunch", "Dinner", "Late+Night"],
  },
  {
    id: "neilson",
    name: "Neilson Dining Hall",
    baseUrl: FOODPRO_UPPER,
    locationNum: "05",
    locationName: "Neilson+Dining+Hall",
    mealPeriods: ["Breakfast", "Lunch", "Dinner", "Knight+Room"],
  },
] as const

/** Lookup by stable id. */
export function getDiningHallById(id: string): DiningHall | undefined {
  return DINING_HALLS.find((hall) => hall.id === id)
}

/** Lookup by display name (matches the keys used by the current/legacy components). */
export function getDiningHallByName(name: string): DiningHall | undefined {
  return DINING_HALLS.find((hall) => hall.name === name)
}

/** Convert a meal-period token ("Knight+Room") to a display label ("Knight Room"). */
export function formatMealPeriod(period: string): string {
  return period.replace(/\+/g, " ")
}

/**
 * Build the FoodPro menu URL for a hall/date/meal. Mirrors the URL construction
 * currently inlined in `app/api/menu/route.ts`, so the scraping route can adopt it
 * later without behavior change.
 *
 * @param date Date string already formatted as the endpoint expects (e.g. "M/D/YYYY").
 */
export function buildMenuUrl(hall: DiningHall, date: string, mealPeriod: string): string {
  return (
    `${hall.baseUrl}?locationNum=${hall.locationNum}` +
    `&locationName=${hall.locationName}` +
    `&dtdate=${date}` +
    `&activeMeal=${mealPeriod}` +
    `&sName=Rutgers+University+Dining`
  )
}
