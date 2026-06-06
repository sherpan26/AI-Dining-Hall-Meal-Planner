import TopNav from "@/components/layout/TopNav"
import { Toaster } from "@/components/ui/sonner"

/**
 * App shell for the AI Dining Concierge: sticky top nav + centered content area.
 * Wraps the new (app) route group.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background to-muted/40">
      <TopNav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
      <footer className="border-t bg-background/60 py-5">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 text-xs text-muted-foreground sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <p className="font-medium text-foreground">RU Dining AI · Rutgers–New Brunswick</p>
            <p>AI meal planning for Busch, Livingston, Neilson &amp; The Atrium.</p>
            <p className="max-w-md text-muted-foreground/80">
              Unofficial student-built tool — not affiliated with Rutgers University or Rutgers Dining Services.
              Nutrition values are estimates for general planning only, not medical or dietary advice.
            </p>
          </div>
        </div>
      </footer>
      <Toaster />
    </div>
  )
}
