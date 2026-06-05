import Link from "next/link"
import TopNav from "@/components/layout/TopNav"
import { Toaster } from "@/components/ui/sonner"

/**
 * App shell for the AI Dining Concierge: sticky top nav + centered content area.
 * Wraps the new (app) route group. The legacy tabbed app at /legacy is intentionally
 * NOT wrapped by this shell.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background to-muted/40">
      <TopNav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
      <footer className="border-t bg-background/60 py-5">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-0.5">
            <p className="font-medium text-foreground">RU Dining AI · Rutgers–New Brunswick</p>
            <p>AI meal planning for Busch, Livingston, Neilson &amp; The Atrium.</p>
          </div>
          <Link href="/legacy" className="self-start hover:text-foreground hover:underline sm:self-auto">
            Legacy app
          </Link>
        </div>
      </footer>
      <Toaster />
    </div>
  )
}
