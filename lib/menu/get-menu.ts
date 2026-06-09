/**
 * Menu provider orchestration.
 *
 * Tries providers in priority order and returns the first that yields items:
 *   1. Nutrislice (cleaner, structured, often has data when FoodPro doesn't)
 *   2. FoodPro    (the original scraper — kept as a fallback)
 *
 * Always returns the same `MenuData` shape the app already expects, plus an
 * optional `source` indicating which provider supplied the items. If no provider
 * returns items, the result has an empty list and a friendly `error` message.
 */

import type { MenuData, MenuItem, MenuSource } from "@/lib/types"
import { getDiningHallByName } from "@/lib/dining-halls"
import { groupMenuByCategory, scrapeDiningMenu } from "@/lib/scrape/menu"
import { scrapeNutrisliceMenu } from "@/lib/scrape/nutrislice"

export interface GetMenuInput {
  /** Dining hall display name, e.g. "Busch Dining Hall". */
  diningHall: string
  /** Date as M/D/YYYY. */
  date: string
  /** Meal-period token, e.g. "Dinner". */
  mealPeriod: string
}

interface MenuProvider {
  id: MenuSource
  getItems: (input: GetMenuInput) => Promise<MenuItem[]>
}

const PROVIDERS: MenuProvider[] = [
  {
    id: "nutrislice",
    getItems: async ({ diningHall, date, mealPeriod }) => {
      const hall = getDiningHallByName(diningHall)
      if (!hall) return []
      const items = await scrapeNutrisliceMenu({ hallId: hall.id, date, meal: mealPeriod })
      return items ?? []
    },
  },
  {
    id: "foodpro",
    getItems: async (input) => (await scrapeDiningMenu(input)).menuItems,
  },
]

const EMPTY_MESSAGE =
  "No menu data found for this hall/meal/date. Rutgers may not have posted this menu yet."

/** Fetch a hall/meal/date menu, preferring Nutrislice and falling back to FoodPro. */
export async function getMenu(input: GetMenuInput): Promise<MenuData> {
  let menuItems: MenuItem[] = []
  let source: MenuSource | null = null

  for (const provider of PROVIDERS) {
    try {
      const items = await provider.getItems(input)
      if (items.length > 0) {
        // Stamp the winning provider onto each item.
        menuItems = items.map((item) => ({ ...item, source: provider.id }))
        source = provider.id
        break
      }
    } catch (error) {
      console.error(`[menu] provider "${provider.id}" failed:`, error)
    }
  }

  const result: MenuData = {
    diningHall: input.diningHall,
    date: input.date,
    mealPeriod: input.mealPeriod,
    menuItems,
    menuByCategory: groupMenuByCategory(menuItems),
    timestamp: new Date().toISOString(),
    source,
  }

  if (menuItems.length === 0) {
    result.error = EMPTY_MESSAGE
  }

  return result
}
