"use client"

import { format } from "date-fns"
import type { SavedPlate } from "@/lib/types"
import type { RecommendedPlate } from "@/lib/ai/plate-schema"
import { getDiningHallById, formatMealPeriod } from "@/lib/dining-halls"
import { Badge } from "@/components/ui/badge"
import PlateCard from "@/components/recommend/PlateCard"

interface SavedPlateCardProps {
  plate: SavedPlate
  /** Whether this plate has been logged before (shows a small badge). */
  loggedBefore?: boolean
  /** Log the plate as eaten today. */
  onLog: (plate: RecommendedPlate) => void
  /** Remove the plate from the saved library. */
  onRemove: (id: string) => void
}

/**
 * A saved plate in the library: the shared PlateCard (with its bookmark = remove
 * and a "Log meal" action) plus a meta header showing hall, meal, and saved date.
 */
export default function SavedPlateCard({ plate, loggedBefore = false, onLog, onRemove }: SavedPlateCardProps) {
  const hall = getDiningHallById(plate.hall)

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 px-1 text-xs text-muted-foreground">
        <span className="min-w-0 truncate">
          {hall?.name ?? plate.hall} · {formatMealPeriod(plate.meal)}
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {loggedBefore && (
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-normal">
              Logged before
            </Badge>
          )}
          Saved {format(plate.savedAt, "MMM d")}
        </span>
      </div>
      <PlateCard plate={plate} saved onToggleSave={() => onRemove(plate.id)} onLogMeal={onLog} />
    </div>
  )
}
