"use client"

import { Bookmark } from "lucide-react"
import { useSavedPlates } from "@/lib/store"
import { getDiningHallById, formatMealPeriod } from "@/lib/dining-halls"
import PlateCard from "@/components/recommend/PlateCard"
import { Card, CardContent } from "@/components/ui/card"

export default function SavedPage() {
  const { savedPlates, removePlate } = useSavedPlates()

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Saved Plates</h1>
        <p className="text-muted-foreground">Saved on this device — no account needed.</p>
      </div>

      {savedPlates.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <Bookmark className="h-8 w-8 text-muted-foreground" />
            <p className="font-medium">No saved plates yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Generate recommendations on the home page and tap the bookmark on a plate to save it here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {savedPlates.map((plate) => {
            const hall = getDiningHallById(plate.hall)
            return (
              <div key={plate.id} className="space-y-1">
                <p className="px-1 text-xs text-muted-foreground">
                  {hall?.name ?? plate.hall} · {formatMealPeriod(plate.meal)}
                </p>
                <PlateCard plate={plate} saved onToggleSave={() => removePlate(plate.id)} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
