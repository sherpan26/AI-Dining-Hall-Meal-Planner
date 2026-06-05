import { Settings as SettingsIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Your goal and dietary preferences guide every recommendation.</p>
      </div>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <SettingsIcon className="h-4 w-4" />
            Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 py-2 text-sm text-muted-foreground">
          <p>This page will let you set:</p>
          <ul className="list-inside list-disc space-y-1">
            <li>Goal — lose, maintain, gain, or maximize protein</li>
            <li>Dietary restrictions — vegetarian, vegan, halal, gluten-free</li>
            <li>Foods to avoid</li>
            <li>Optional calorie target</li>
          </ul>
          <p className="pt-2">Preferences will be saved locally in your browser. The form lands in a later step.</p>
        </CardContent>
      </Card>
    </div>
  )
}
