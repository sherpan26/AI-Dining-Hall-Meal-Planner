"use client"

import { useState } from "react"
import { Sparkles, ArrowRight } from "lucide-react"
import { DINING_HALLS, getDiningHallById, formatMealPeriod } from "@/lib/dining-halls"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function HomePage() {
  const [hallId, setHallId] = useState<string>("")
  const [meal, setMeal] = useState<string>("")
  const [note, setNote] = useState<string>("")

  const hall = getDiningHallById(hallId)
  const canSubmit = Boolean(hallId && meal)

  const handleHallChange = (value: string) => {
    setHallId(value)
    setMeal("") // reset meal when hall changes
    setNote("")
  }

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="space-y-3 text-center">
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="h-3.5 w-3.5" />
          AI Dining Concierge
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          What should you eat at Rutgers today?
        </h1>
        <p className="mx-auto max-w-xl text-muted-foreground">
          Pick a dining hall and meal, and get AI-recommended plates built from today&apos;s real menu — matched to
          your goals and dietary needs.
        </p>
      </section>

      {/* Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Find your plate</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Dining hall</label>
              <Select value={hallId} onValueChange={handleHallChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a dining hall" />
                </SelectTrigger>
                <SelectContent>
                  {DINING_HALLS.map((h) => (
                    <SelectItem key={h.id} value={h.id}>
                      {h.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Meal</label>
              <Select value={meal} onValueChange={setMeal} disabled={!hall}>
                <SelectTrigger>
                  <SelectValue placeholder={hall ? "Select a meal" : "Pick a hall first"} />
                </SelectTrigger>
                <SelectContent>
                  {hall?.mealPeriods.map((period) => (
                    <SelectItem key={period} value={period}>
                      {formatMealPeriod(period)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            className="w-full gap-2"
            disabled={!canSubmit}
            onClick={() => setNote("Live recommendations are coming in the next step.")}
          >
            Get Recommendations
            <ArrowRight className="h-4 w-4" />
          </Button>
          {note && <p className="text-center text-sm text-muted-foreground">{note}</p>}
        </CardContent>
      </Card>

      {/* Today's Pick placeholder */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold">Today&apos;s Pick</h2>
          <Badge variant="outline" className="text-[10px]">
            Preview
          </Badge>
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <p className="font-medium">Your top AI plate will appear here</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Once recommendations are wired up, this card highlights the single best plate for your goal from
              today&apos;s menu — with macros and a quick reason why.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
