import { AlertTriangle, Bookmark, BookmarkCheck } from "lucide-react"
import type { RecommendedPlate, PlateNutrition } from "@/lib/ai/plate-schema"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn, formatFoodName } from "@/lib/utils"

/** Compact per-item macros, e.g. "220 cal · 25P / 0C / 6F". */
function itemMacros(n: PlateNutrition): string {
  return `${Math.round(n.calories)} cal · ${Math.round(n.protein)}P / ${Math.round(n.carbs)}C / ${Math.round(n.fat)}F`
}

const MACRO_STATS: { key: keyof PlateNutrition; label: string; suffix: string; dot?: string }[] = [
  { key: "calories", label: "Calories", suffix: "" },
  { key: "protein", label: "Protein", suffix: "g", dot: "bg-primary" },
  { key: "carbs", label: "Carbs", suffix: "g", dot: "bg-amber-400" },
  { key: "fat", label: "Fat", suffix: "g", dot: "bg-sky-400" },
]

interface PlateCardProps {
  plate: RecommendedPlate
  /** Render with emphasis (used for Today's Pick). */
  highlight?: boolean
  /** Whether this plate is currently saved. */
  saved?: boolean
  /** If provided, a save/unsave button is shown. */
  onToggleSave?: (plate: RecommendedPlate) => void
}

export default function PlateCard({ plate, highlight = false, saved = false, onToggleSave }: PlateCardProps) {
  return (
    <Card className={cn("flex flex-col", highlight && "border-primary/60 shadow-sm ring-1 ring-primary/20")}>
      <CardHeader className="gap-2 pb-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="min-w-0 text-base leading-snug">{plate.title}</CardTitle>
          {onToggleSave && (
            <Button
              variant={saved ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8 shrink-0"
              aria-label={saved ? "Remove from saved" : "Save plate"}
              aria-pressed={saved}
              onClick={() => onToggleSave(plate)}
            >
              {saved ? (
                <BookmarkCheck className="h-4 w-4 text-primary" />
              ) : (
                <Bookmark className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          )}
        </div>
        {plate.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {plate.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="rounded-full text-[10px] font-normal">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4">
        {/* Items */}
        <ul className="divide-y rounded-md border">
          {plate.items.map((item, i) => (
            <li key={`${item.name}-${i}`} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <span className="min-w-0 truncate font-medium">{formatFoodName(item.name)}</span>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {itemMacros(item.nutrition)}
              </span>
            </li>
          ))}
        </ul>

        {/* Plate totals */}
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Plate total</p>

          {/* Macro proportion bar (by calorie contribution) */}
          {(() => {
            const pCal = plate.totals.protein * 4
            const cCal = plate.totals.carbs * 4
            const fCal = plate.totals.fat * 9
            const macroTotal = pCal + cCal + fCal || 1
            const pct = (v: number) => `${(v / macroTotal) * 100}%`
            return (
              <div className="flex h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
                <div className="bg-primary" style={{ width: pct(pCal) }} />
                <div className="bg-amber-400" style={{ width: pct(cCal) }} />
                <div className="bg-sky-400" style={{ width: pct(fCal) }} />
              </div>
            )
          })()}

          <div className="grid grid-cols-4 gap-2">
            {MACRO_STATS.map((m) => (
              <div key={m.key} className="rounded-md bg-muted py-2 text-center">
                <div className="text-sm font-semibold tabular-nums">
                  {Math.round(plate.totals[m.key])}
                  {m.suffix}
                </div>
                <div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                  {m.dot && <span className={cn("h-1.5 w-1.5 rounded-full", m.dot)} />}
                  {m.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {plate.rationale && <p className="text-sm text-muted-foreground">{plate.rationale}</p>}

        {plate.warnings.length > 0 && (
          <div className="mt-auto flex items-start gap-1.5 rounded-md bg-amber-50 px-2.5 py-1.5 text-xs text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{plate.warnings.join(" · ")}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
