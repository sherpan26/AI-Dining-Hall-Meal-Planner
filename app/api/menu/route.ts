import { NextResponse } from "next/server"
import { scrapeDiningMenu } from "@/lib/scrape/menu"

export async function POST(req: Request) {
  try {
    const { diningHall, date, mealPeriod } = await req.json()

    const data = await scrapeDiningMenu({ diningHall, date, mealPeriod })

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in menu API:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "An error occurred" }, { status: 500 })
  }
}
