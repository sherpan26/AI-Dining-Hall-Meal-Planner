"use client"

import { Clock, Trash2 } from "lucide-react"
import type { LoggedMeal } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatFoodName } from "@/lib/utils"

/** One logged (eaten) meal with macros, metadata, items, and a remove action. */
export default function LoggedMealCard({
  meal,
  onRemove,
}: {
  meal: LoggedMeal
  onRemove: (id: string) => void
}) {
  const time = new Date(meal.loggedAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
  const t = meal.totals

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1.5">
            <p className="font-medium leading-snug">{meal.title}</p>
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <Badge variant="secondary" className="font-normal">
                {meal.hall}
              </Badge>
              <Badge variant="secondary" className="font-normal">
                {meal.meal}
              </Badge>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {time}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
            aria-label={`Remove ${meal.title} from your log`}
            onClick={() => onRemove(meal.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs tabular-nums">
          <span className="font-medium">{Math.round(t.calories)} cal</span>
          <span className="text-muted-foreground">{Math.round(t.protein)}g protein</span>
          <span className="text-muted-foreground">{Math.round(t.carbs)}g carbs</span>
          <span className="text-muted-foreground">{Math.round(t.fat)}g fat</span>
        </div>

        {meal.items.length > 0 && (
          <p className="text-xs text-muted-foreground">{meal.items.map((i) => formatFoodName(i.name)).join(" · ")}</p>
        )}
      </CardContent>
    </Card>
  )
}
