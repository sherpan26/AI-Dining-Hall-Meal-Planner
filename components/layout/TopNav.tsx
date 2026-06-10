"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Bookmark, ClipboardList, BookOpen, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import ThemeToggle from "@/components/layout/ThemeToggle"

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/log", label: "Log", icon: ClipboardList },
  { href: "/resources", label: "Resources", icon: BookOpen },
  { href: "/settings", label: "Settings", icon: Settings },
]

export default function TopNav() {
  const pathname = usePathname()

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href))

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/80 backdrop-blur">
      {/* Scarlet brand line */}
      <div className="h-1 w-full bg-primary" />
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-extrabold tracking-tight text-primary-foreground shadow-sm">
            RU
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-sm font-semibold">Dining AI</span>
            <span className="text-[10px] text-muted-foreground">Rutgers–New Brunswick</span>
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-muted",
                  isActive(href) ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            ))}
          </nav>
          <div className="mx-1 h-5 w-px bg-border" />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
