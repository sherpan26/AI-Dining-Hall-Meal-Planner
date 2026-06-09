import { NextResponse } from "next/server"
import { getMenu } from "@/lib/menu/get-menu"

export async function POST(req: Request) {
  try {
    const { diningHall, date, mealPeriod } = await req.json()

    // Prefer Nutrislice, fall back to FoodPro; same response shape as before
    // (now with an optional `source`, and a friendly `error` when both are empty).
    const data = await getMenu({ diningHall, date, mealPeriod })

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in menu API:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "An error occurred" }, { status: 500 })
  }
}
