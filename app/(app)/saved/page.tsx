import { Bookmark } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function SavedPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Saved Plates</h1>
        <p className="text-muted-foreground">Plates you save will be kept here.</p>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <Bookmark className="h-8 w-8 text-muted-foreground" />
          <p className="font-medium">No saved plates yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Saved plates will be stored locally in your browser (no account needed) and listed here. Saving comes
            online once recommendations are wired up.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
