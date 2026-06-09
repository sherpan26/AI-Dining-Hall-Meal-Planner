/**
 * Reusable Rutgers dining menu scraping.
 *
 * Extracted verbatim from app/api/menu/route.ts so the logic can be reused (and
 * tested) outside the HTTP handler. Behavior is unchanged: same URL, same
 * regex-based HTML parsing, same response shape.
 */

import { buildMenuUrl, getDiningHallByName } from "@/lib/dining-halls"
import type { MenuData, MenuItem } from "@/lib/types"

const SCRAPE_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"

export interface ScrapeMenuInput {
  /** Dining hall display name, e.g. "Busch Dining Hall". */
  diningHall: string
  /** Date as the FoodPro endpoint expects it, e.g. "M/D/YYYY". */
  date: string
  /** Meal-period token, e.g. "Dinner" or "Knight+Room". */
  mealPeriod: string
}

/** Parse menu items (name, category, portion, nutrition link) out of FoodPro HTML. */
export function extractMenuItems(html: string): MenuItem[] {
  const menuItems: MenuItem[] = []
  let currentCategory = "Uncategorized"

  // Find all h3 elements (categories) and fieldsets (menu items)
  const categoryRegex = /<h3[^>]*>([\s\S]*?)<\/h3>/gi
  const fieldsetRegex = /<fieldset[^>]*>([\s\S]*?)<\/fieldset>/gi

  // First, find all categories
  let categoryMatch
  const categories: { text: string; position: number }[] = []
  while ((categoryMatch = categoryRegex.exec(html)) !== null) {
    const categoryText = categoryMatch[1].replace(/<[^>]*>/g, "").trim()
    if (categoryText) {
      categories.push({
        text: categoryText.replace(/^--\s*|\s*--$/g, ""),
        position: categoryMatch.index,
      })
    }
  }

  // Then find all menu items
  let fieldsetMatch
  while ((fieldsetMatch = fieldsetRegex.exec(html)) !== null) {
    const fieldsetContent = fieldsetMatch[0]
    const fieldsetPosition = fieldsetMatch.index

    // Find the most recent category
    for (let i = categories.length - 1; i >= 0; i--) {
      if (categories[i].position < fieldsetPosition) {
        currentCategory = categories[i].text
        break
      }
    }

    // Extract item details
    const nameMatch = fieldsetContent.match(/<div class="col-1[^>]*>[\s\S]*?<label[^>]*>([\s\S]*?)<\/label>/i)
    if (nameMatch && nameMatch[1]) {
      const name = nameMatch[1].replace(/<[^>]*>/g, "").trim()

      // Extract portion size
      const portionMatch = fieldsetContent.match(/<div class="col-2[^>]*>[\s\S]*?<label[^>]*>([\s\S]*?)<\/label>/i)
      const portion = portionMatch ? portionMatch[1].replace(/<[^>]*>/g, "").trim() : ""

      // Extract nutrition link - look for the exact pattern in the HTML example
      const nutritionMatch = fieldsetContent.match(
        /<div class="col-3"[^>]*>[\s\S]*?<a href=['"](label\.aspx[^'"]*)['"]/i,
      )
      let nutritionLink: string | null = null

      if (nutritionMatch && nutritionMatch[1]) {
        // Construct the full URL for the nutrition link
        nutritionLink = `https://menuportal23.dining.rutgers.edu/foodpronet/${nutritionMatch[1]}`
      }

      menuItems.push({
        name,
        category: currentCategory,
        portion,
        nutritionLink,
      })
    }
  }

  return menuItems
}

/**
 * Fetch and parse a dining hall menu. Mirrors the previous /api/menu behavior,
 * including the 1-hour fetch cache. Throws on unknown hall or non-OK response;
 * callers translate that into an HTTP error.
 */
export async function scrapeDiningMenu(input: ScrapeMenuInput): Promise<MenuData> {
  const { diningHall, date, mealPeriod } = input

  const hall = getDiningHallByName(diningHall)
  if (!hall) {
    throw new Error(`Unknown dining hall: ${diningHall}`)
  }

  const url = buildMenuUrl(hall, date, mealPeriod)
  const response = await fetch(url, {
    headers: { "User-Agent": SCRAPE_USER_AGENT },
    next: { revalidate: 3600 }, // Cache for 1 hour
  })

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`)
  }

  const html = await response.text()
  const menuItems = extractMenuItems(html)

  return {
    diningHall,
    date,
    mealPeriod,
    menuItems,
    menuByCategory: groupMenuByCategory(menuItems),
    timestamp: new Date().toISOString(),
  }
}

/** Group a flat list of menu items by their `category` (preserving insertion order). */
export function groupMenuByCategory(items: MenuItem[]): Record<string, MenuItem[]> {
  return items.reduce<Record<string, MenuItem[]>>((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {})
}
