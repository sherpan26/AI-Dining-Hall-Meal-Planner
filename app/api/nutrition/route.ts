import { NextResponse } from "next/server"
import { scrapeNutrition } from "@/lib/scrape/nutrition"

export async function POST(req: Request) {
  try {
    const { nutritionLink } = await req.json()

    if (!nutritionLink) {
      return NextResponse.json({ error: "Nutrition link is required" }, { status: 400 })
    }

    const data = await scrapeNutrition({ nutritionLink })

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in nutrition API:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "An error occurred" }, { status: 500 })
  }
}
