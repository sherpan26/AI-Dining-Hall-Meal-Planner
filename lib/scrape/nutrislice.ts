/**
 * Nutrislice menu provider.
 *
 * Rutgers Dining publishes structured menu data on Nutrislice, which often has
 * data even when FoodPro returns "No Data Available" (summer, holidays, etc.).
 *
 * This reads Nutrislice's public JSON API (host `rutgers.api.nutrislice.com`) — no
 * HTML/DOM scraping — and normalizes it into the app's `MenuItem` shape.
 *
 * Notes / limitations:
 * - Only Busch, Livingston, and Neilson are on Nutrislice. The Atrium is not, so
 *   this provider returns `null` for it and the caller falls back to FoodPro.
 * - Menu-type slugs are not stable (Busch lunch is "lunch-test"), so we resolve
 *   them dynamically from each school's `active_menu_types` by matching the name.
 * - The weekly endpoint returns 7 days; we select the requested date. Some menu
 *   types are weekday-only, so weekend dates can legitimately come back empty.
 */

import type { DiningHallId } from "@/lib/dining-halls"
import type { MenuItem } from "@/lib/types"

const NUTRISLICE_API = "https://rutgers.api.nutrislice.com"
const NS_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"

/** Map our hall ids to Nutrislice school slugs. Halls not on Nutrislice are omitted. */
const SCHOOL_SLUGS: Partial<Record<DiningHallId, string>> = {
  busch: "busch-dining-hall",
  livingston: "livingston-dining-commons",
  neilson: "neilson-dining-hall",
  // The Atrium is not published on Nutrislice.
}

export interface NutrisliceInput {
  hallId: DiningHallId
  /** Date as M/D/YYYY (the same format the app already passes around). */
  date: string
  /** Meal-period token, e.g. "Breakfast", "Lunch", "Dinner", "Knight+Room". */
  meal: string
}

// --- Minimal shapes for the parts of the Nutrislice JSON we use ---

interface NsMenuType {
  id: number
  name: string
  slug: string
}
interface NsSchool {
  id: number
  slug: string
  name: string
  active_menu_types?: NsMenuType[]
}
interface NsServingSize {
  serving_size_amount?: string
  serving_size_unit?: string
}
interface NsFoodIconSprite {
  slug?: string
  name?: string
  help_text?: string
}
interface NsFoodIcon {
  sprite?: NsFoodIconSprite
}
interface NsFood {
  name?: string
  serving_size_info?: NsServingSize
  rounded_nutrition_info?: Record<string, number | null>
  icons?: { food_icons?: NsFoodIcon[] }
}
interface NsMenuItem {
  is_section_title?: boolean
  is_station_header?: boolean
  text?: string
  food?: NsFood | null
}
interface NsDay {
  date: string
  menu_items?: NsMenuItem[]
}
interface NsWeek {
  days?: NsDay[]
}

async function fetchJson<T>(url: string, revalidate: number): Promise<T> {
  const res = await fetch(url, {
    headers: { "User-Agent": NS_UA, Accept: "application/json" },
    next: { revalidate },
  })
  if (!res.ok) throw new Error(`Nutrislice HTTP ${res.status} for ${url}`)
  return (await res.json()) as T
}

/** Reduce a meal-period token to a keyword we can match against menu-type names. */
function mealKeyword(meal: string): string {
  const m = meal.toLowerCase()
  if (m.includes("breakfast")) return "breakfast"
  if (m.includes("lunch") || m.includes("brunch")) return "lunch"
  if (m.includes("dinner")) return "dinner"
  if (m.includes("knight") || m.includes("late")) return "knight"
  return m
}

/** Parse M/D/YYYY into URL parts + an ISO date for matching the week's days. */
function parseDate(date: string): { y: number; m: number; d: number; iso: string } | null {
  const parts = date.split("/")
  if (parts.length !== 3) return null
  const m = Number(parts[0])
  const d = Number(parts[1])
  const y = Number(parts[2])
  if (!m || !d || !y) return null
  const iso = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`
  return { y, m, d, iso }
}

/** Find the school's active menu type whose name matches the requested meal. */
function pickMenuType(school: NsSchool, meal: string): NsMenuType | null {
  const kw = mealKeyword(meal)
  return school.active_menu_types?.find((mt) => mt.name.toLowerCase().includes(kw)) ?? null
}

/** Dietary-tag icon names (everything else with a "contains" hint is an allergen). */
const DIET_ICON_NAMES = new Set(["vegan", "vegetarian", "halal", "kosher", "gluten free", "gluten-free"])

function toFiniteNumber(value: number | null | undefined): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined
}

/** Split a food's icons into allergens vs dietary tags (ignoring color/rating icons). */
function classifyIcons(icons?: NsFoodIcon[]): { allergens: string[]; dietaryTags: string[] } {
  const allergens: string[] = []
  const dietaryTags: string[] = []

  for (const icon of icons ?? []) {
    const name = icon.sprite?.name?.trim()
    if (!name) continue // color/traffic-light icons have no name
    const help = (icon.sprite?.help_text ?? "").toLowerCase()

    if (help.includes("contains")) {
      allergens.push(name)
    } else if (DIET_ICON_NAMES.has(name.toLowerCase()) || help.includes("suitable") || help.includes("free of")) {
      dietaryTags.push(name)
    }
  }

  return { allergens, dietaryTags }
}

/** Normalize a day's flat menu_items into the app's MenuItem[]. */
function normalizeDay(items: NsMenuItem[]): MenuItem[] {
  const out: MenuItem[] = []
  let category = "Uncategorized"

  for (const item of items) {
    // Section titles and station headers act as the running category.
    if (item.is_section_title || item.is_station_header) {
      const text = (item.text ?? "").trim()
      if (text) category = text
      continue
    }

    const food = item.food
    if (!food?.name) continue

    const amount = food.serving_size_info?.serving_size_amount?.trim()
    const unit = food.serving_size_info?.serving_size_unit?.trim()
    const portion = amount && unit ? `${amount} ${unit}` : (amount ?? "")

    const menuItem: MenuItem = {
      name: food.name.trim(),
      category,
      portion,
      // Nutrislice has structured nutrition inline rather than a label page URL.
      nutritionLink: null,
    }

    // Macros, when present.
    const rni = food.rounded_nutrition_info
    const calories = toFiniteNumber(rni?.calories)
    const protein = toFiniteNumber(rni?.g_protein)
    const carbs = toFiniteNumber(rni?.g_carbs)
    const fat = toFiniteNumber(rni?.g_fat)
    if (calories !== undefined) menuItem.calories = calories
    if (protein !== undefined) menuItem.protein = protein
    if (carbs !== undefined) menuItem.carbs = carbs
    if (fat !== undefined) menuItem.fat = fat

    // Allergens + dietary tags from icons.
    const { allergens, dietaryTags } = classifyIcons(food.icons?.food_icons)
    if (allergens.length) menuItem.allergens = allergens
    if (dietaryTags.length) menuItem.dietaryTags = dietaryTags

    out.push(menuItem)
  }

  return out
}

/** Cache the schools list briefly (it's small and changes rarely). */
async function getSchool(hallId: DiningHallId): Promise<NsSchool | null> {
  const slug = SCHOOL_SLUGS[hallId]
  if (!slug) return null
  const schools = await fetchJson<NsSchool[]>(`${NUTRISLICE_API}/menu/api/schools/`, 86400)
  return schools.find((s) => s.slug === slug) ?? null
}

/**
 * Fetch and normalize a Nutrislice menu for one hall/meal/date.
 *
 * Returns:
 * - `null` when Nutrislice can't serve this request (hall not on Nutrislice, no
 *   matching menu type, or a bad date) — the caller should fall back.
 * - `MenuItem[]` (possibly empty) when the day was found.
 *
 * Throws on network/parse errors so the caller can fall back on failure.
 */
export async function scrapeNutrisliceMenu(input: NutrisliceInput): Promise<MenuItem[] | null> {
  const school = await getSchool(input.hallId)
  if (!school) return null

  const menuType = pickMenuType(school, input.meal)
  if (!menuType) return null

  const pd = parseDate(input.date)
  if (!pd) return null

  const url = `${NUTRISLICE_API}/menu/api/weeks/school/${school.id}/menu-type/${menuType.id}/${pd.y}/${String(
    pd.m,
  ).padStart(2, "0")}/${String(pd.d).padStart(2, "0")}`

  const week = await fetchJson<NsWeek>(url, 3600)
  const day = week.days?.find((d) => d.date === pd.iso)
  if (!day?.menu_items) return []

  return normalizeDay(day.menu_items)
}
