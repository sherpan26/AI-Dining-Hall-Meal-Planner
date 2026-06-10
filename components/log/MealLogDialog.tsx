"use client"

import { useEffect, useState } from "react"
import { Minus, Plus } from "lucide-react"
import type { LoggedMeal, MacroTotals } from "@/lib/types"
import type { RecommendedPlate } from "@/lib/ai/plate-schema"
import { getLocalDateKey } from "@/lib/date"
import { cn, formatFoodName } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export type MealPeriodOption = "Breakfast" | "Lunch" | "Dinner" | "Snack"
const MEAL_PERIODS: MealPeriodOption[] = ["Breakfast", "Lunch", "Dinner", "Snack"]

const ZERO: MacroTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 }

export interface MealDraftItem {
  name: string
  portion?: string
  /** Per-unit nutrition (a single serving); undefined when unavailable. */
  nutrition?: MacroTotals
  quantity: number
}

export interface MealDraft {
  /** Present in edit mode (the logged meal's id). */
  id?: string
  plateId?: string
  title: string
  hall: string
  meal: MealPeriodOption
  /** Present in edit mode (the day the meal counts toward). */
  date?: string
  items: MealDraftItem[]
  tags?: string[]
  warnings?: string[]
  note?: string
}

/** Map any meal label (e.g. "Knight Room", "Dinner") to one of the four options. */
export function normalizeMealPeriod(label: string): MealPeriodOption {
  const l = label.toLowerCase()
  if (l.includes("breakfast")) return "Breakfast"
  if (l.includes("lunch")) return "Lunch"
  if (l.includes("dinner")) return "Dinner"
  return "Snack"
}

/** Build a create-mode draft from an AI/saved plate (all items default to 1×). */
export function draftFromPlate(plate: RecommendedPlate, hallName: string, mealLabel: string): MealDraft {
  return {
    plateId: plate.id,
    title: plate.title,
    hall: hallName,
    meal: normalizeMealPeriod(mealLabel),
    items: plate.items.map((i) => ({ name: i.name, nutrition: i.nutrition, quantity: 1 })),
    tags: plate.tags,
    warnings: plate.warnings,
  }
}

/** Build an edit-mode draft from an existing logged meal (prefills quantities). */
export function draftFromLogged(meal: LoggedMeal): MealDraft {
  return {
    id: meal.id,
    plateId: meal.plateId,
    title: meal.title,
    hall: meal.hall,
    meal: normalizeMealPeriod(meal.meal),
    date: meal.date,
    items: meal.items.map((it, idx) => ({
      name: it.name,
      nutrition: it.nutrition,
      quantity: meal.quantities?.[idx] ?? 1,
    })),
    tags: meal.tags,
    warnings: meal.warnings,
    note: meal.note,
  }
}

/** Snap a quantity to [0, 5] in 0.5 steps. */
function clampQty(q: number): number {
  const stepped = Math.round(q / 0.5) * 0.5
  return Math.min(5, Math.max(0, stepped))
}

function formatQty(q: number): string {
  return Number.isInteger(q) ? String(q) : q.toFixed(1)
}

function computeTotals(items: MealDraftItem[], quantities: number[]): MacroTotals {
  return items.reduce<MacroTotals>((acc, it, idx) => {
    const q = quantities[idx] ?? 0
    if (q <= 0 || !it.nutrition) return acc
    return {
      calories: acc.calories + it.nutrition.calories * q,
      protein: acc.protein + it.nutrition.protein * q,
      carbs: acc.carbs + it.nutrition.carbs * q,
      fat: acc.fat + it.nutrition.fat * q,
    }
  }, { ...ZERO })
}

interface MealLogDialogProps {
  mode: "create" | "edit"
  open: boolean
  onOpenChange: (open: boolean) => void
  draft: MealDraft | null
  /** Called with the meal payload (minus id/loggedAt) when the user confirms. */
  onConfirm: (meal: Omit<LoggedMeal, "id" | "loggedAt">) => void
}

/** Confirm/adjust portions before logging a meal (create), or edit an existing one. */
export default function MealLogDialog({ mode, open, onOpenChange, draft, onConfirm }: MealLogDialogProps) {
  const [quantities, setQuantities] = useState<number[]>([])
  const [period, setPeriod] = useState<MealPeriodOption>("Lunch")
  const [note, setNote] = useState("")

  // Re-seed local state whenever a new draft is opened.
  useEffect(() => {
    if (!draft) return
    setQuantities(draft.items.map((i) => clampQty(i.quantity)))
    setPeriod(draft.meal)
    setNote(draft.note ?? "")
  }, [draft])

  if (!draft) return null

  // Derive effective quantities so the very first render (before the effect
  // syncs) still reflects the draft instead of showing zeros.
  const q = quantities.length === draft.items.length ? quantities : draft.items.map((i) => clampQty(i.quantity))
  const totals = computeTotals(draft.items, q)
  const allZero = q.every((v) => v <= 0)

  const setQty = (idx: number, next: number) => {
    setQuantities(q.map((v, i) => (i === idx ? clampQty(next) : v)))
  }

  const handleConfirm = () => {
    onConfirm({
      plateId: draft.plateId,
      title: draft.title,
      hall: draft.hall,
      meal: period,
      date: mode === "edit" ? draft.date ?? getLocalDateKey() : getLocalDateKey(),
      items: draft.items.map((it) => ({ name: it.name, nutrition: it.nutrition ?? { ...ZERO } })),
      quantities: q.map(clampQty),
      totals,
      tags: draft.tags,
      warnings: draft.warnings,
      note: note.trim() || undefined,
    })
    onOpenChange(false)
  }

  const macroCells = [
    { label: "kcal", value: Math.round(totals.calories).toLocaleString() },
    { label: "Protein", value: `${Math.round(totals.protein)}g` },
    { label: "Carbs", value: `${Math.round(totals.carbs)}g` },
    { label: "Fat", value: `${Math.round(totals.fat)}g` },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="space-y-1 border-b p-5 pb-4 text-left">
          <DialogTitle>{mode === "edit" ? "Edit logged meal" : "Confirm what you ate"}</DialogTitle>
          <DialogDescription>Adjust portions before updating your daily log.</DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto p-5">
          <div className="space-y-0.5">
            <p className="font-medium leading-snug">{draft.title}</p>
            <p className="text-xs text-muted-foreground">{draft.hall}</p>
          </div>

          <div className="space-y-1.5">
            <Label>Meal</Label>
            <Select value={period} onValueChange={(v) => setPeriod(v as MealPeriodOption)}>
              <SelectTrigger aria-label="Meal period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEAL_PERIODS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Items &amp; portions</Label>
            <ul className="divide-y rounded-md border">
              {draft.items.map((it, idx) => {
                const qty = q[idx] ?? 0
                return (
                  <li key={`${it.name}-${idx}`} className={cn("flex items-center gap-3 p-3", qty <= 0 && "opacity-50")}>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="truncate text-sm font-medium">{formatFoodName(it.name)}</p>
                      <p className="text-xs text-muted-foreground">
                        {it.portion ? `${it.portion} · ` : ""}
                        {it.nutrition
                          ? `${Math.round(it.nutrition.calories)} cal · ${Math.round(it.nutrition.protein)}P / ${Math.round(it.nutrition.carbs)}C / ${Math.round(it.nutrition.fat)}F`
                          : "nutrition unavailable"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        aria-label={`Decrease ${it.name}`}
                        disabled={qty <= 0}
                        onClick={() => setQty(idx, qty - 0.5)}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <span className="w-8 text-center text-sm tabular-nums">{formatQty(qty)}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        aria-label={`Increase ${it.name}`}
                        disabled={qty >= 5}
                        onClick={() => setQty(idx, qty + 0.5)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="meal-note">
              Note <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="meal-note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. skipped the sauce, extra veggies"
            />
          </div>

          <div className="space-y-2 rounded-lg bg-muted/50 p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Adjusted total</p>
            <div className="grid grid-cols-4 gap-2 text-center">
              {macroCells.map((s) => (
                <div key={s.label}>
                  <div className="text-sm font-semibold tabular-nums">{s.value}</div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Nutrition values are estimates based on available dining data.
          </p>
        </div>

        <DialogFooter className="gap-2 border-t p-4">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={allZero} onClick={handleConfirm}>
            {mode === "edit" ? "Save changes" : "Log meal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
