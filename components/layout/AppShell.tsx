import Link from "next/link"
import TopNav from "@/components/layout/TopNav"

/**
 * App shell for the AI Dining Concierge: sticky top nav + centered content area.
 * Wraps the new (app) route group. The legacy tabbed app at /legacy is intentionally
 * NOT wrapped by this shell.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <TopNav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
      <footer className="border-t py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 text-xs text-muted-foreground">
          <span>RU Dining AI — AI meal planning for Rutgers dining halls</span>
          <Link href="/legacy" className="hover:underline">
            Legacy app
          </Link>
        </div>
      </footer>
    </div>
  )
}
