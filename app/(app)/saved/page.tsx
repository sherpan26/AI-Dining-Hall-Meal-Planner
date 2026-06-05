"use client"

import Link from "next/link"
import { Bookmark } from "lucide-react"
import { format } from "date-fns"
import { useSavedPlates } from "@/lib/store"
import { getDiningHallById, formatMealPeriod } from "@/lib/dining-halls"
import PlateCard from "@/components/recommend/PlateCard"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function SavedPage() {
  const { savedPlates, removePlate } = useSavedPlates()
  const count = savedPlates.length

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Saved Plates</h1>
        <p className="text-muted-foreground">
          {count > 0
            ? `${count} plate${count === 1 ? "" : "s"} saved on this device.`
            : "Saved on this device — no account needed."}
        </p>
      </div>

      {count === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Bookmark className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">No saved plates yet</p>
              <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                Tap the bookmark on any recommendation to keep it here for later.
              </p>
            </div>
            <Button asChild className="mt-1">
              <Link href="/">Get recommendations</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {savedPlates.map((plate) => {
            const hall = getDiningHallById(plate.hall)
            return (
              <div key={plate.id} className="space-y-1.5">
                <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
                  <span>
                    {hall?.name ?? plate.hall} · {formatMealPeriod(plate.meal)}
                  </span>
                  <span>Saved {format(plate.savedAt, "MMM d")}</span>
                </div>
                <PlateCard plate={plate} saved onToggleSave={() => removePlate(plate.id)} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
