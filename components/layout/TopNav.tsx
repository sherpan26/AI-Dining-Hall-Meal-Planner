"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { UtensilsCrossed, Home, Bookmark, Settings, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  disabled?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/compare", label: "Compare", icon: BarChart3, disabled: true },
]

export default function TopNav() {
  const pathname = usePathname()

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href))

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <UtensilsCrossed className="h-5 w-5 text-primary" />
          <span>RU Dining AI</span>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon, disabled }) =>
            disabled ? (
              <span
                key={href}
                aria-disabled
                className="flex cursor-not-allowed items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground/60"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
                <Badge variant="secondary" className="ml-1 hidden px-1.5 py-0 text-[10px] sm:inline">
                  Soon
                </Badge>
              </span>
            ) : (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-muted",
                  isActive(href) ? "bg-muted font-medium text-foreground" : "text-muted-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            ),
          )}
        </nav>
      </div>
    </header>
  )
}
