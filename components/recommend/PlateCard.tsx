import { AlertTriangle } from "lucide-react"
import type { RecommendedPlate, PlateNutrition } from "@/lib/ai/plate-schema"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

/** Compact macro line, e.g. "620 cal · 55g protein · 40g carbs · 18g fat". */
function macroLine(n: PlateNutrition): string {
  return `${Math.round(n.calories)} cal · ${Math.round(n.protein)}g protein · ${Math.round(
    n.carbs,
  )}g carbs · ${Math.round(n.fat)}g fat`
}

interface PlateCardProps {
  plate: RecommendedPlate
  /** Render with emphasis (used for Today's Pick). */
  highlight?: boolean
}

export default function PlateCard({ plate, highlight = false }: PlateCardProps) {
  return (
    <Card className={cn(highlight && "border-primary/50 ring-1 ring-primary/20")}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{plate.title}</CardTitle>
          <span className="shrink-0 text-sm font-semibold text-primary">
            {Math.round(plate.totals.calories)} cal
          </span>
        </div>
        {plate.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {plate.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px] font-normal">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        <ul className="space-y-1.5">
          {plate.items.map((item, i) => (
            <li key={`${item.name}-${i}`} className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium">{item.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{macroLine(item.nutrition)}</span>
            </li>
          ))}
        </ul>

        <div className="rounded-md bg-muted px-3 py-2 text-xs font-medium">Total: {macroLine(plate.totals)}</div>

        {plate.rationale && <p className="text-sm text-muted-foreground">{plate.rationale}</p>}

        {plate.warnings.length > 0 && (
          <div className="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-500">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{plate.warnings.join(" · ")}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
