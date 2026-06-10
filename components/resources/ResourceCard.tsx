import { ArrowUpRight, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface ResourceCardProps {
  title: string
  source: string
  category: string
  /** e.g. "Official resource", "Guide", "Article". */
  type: string
  href: string
  description: string
  /** One-line "Why it helps". */
  why: string
  readTime?: string
  icon: React.ComponentType<{ className?: string }>
  /** Tailwind gradient classes for the CSS thumbnail, e.g. "from-primary to-rose-800". */
  gradient: string
  featured?: boolean
}

/**
 * An article-preview-style card for a trusted external resource. The thumbnail is
 * a CSS gradient with a lucide icon overlay (no external images / licensing).
 */
export default function ResourceCard({
  title,
  source,
  category,
  type,
  href,
  description,
  why,
  readTime,
  icon: Icon,
  gradient,
  featured = false,
}: ResourceCardProps) {
  return (
    <Card className={cn("flex overflow-hidden", featured ? "flex-col sm:flex-row" : "flex-col")}>
      {/* CSS thumbnail */}
      <div
        className={cn(
          "relative flex shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br",
          gradient,
          featured ? "h-32 sm:h-auto sm:w-48" : "h-24",
        )}
      >
        <div aria-hidden className="pointer-events-none absolute -right-4 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
        <Icon className={cn("text-white/30", featured ? "h-20 w-20" : "h-14 w-14")} />
        <Badge className="absolute left-2 top-2 border-0 bg-white/20 text-white backdrop-blur hover:bg-white/20">
          {category}
        </Badge>
      </div>

      {/* Body */}
      <CardContent className={cn("flex flex-1 flex-col gap-2 p-4", featured && "sm:p-5")}>
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="font-medium">{source}</span>
          <span className="flex items-center gap-2">
            <span>{type}</span>
            {readTime && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {readTime}
              </span>
            )}
          </span>
        </div>

        <h3 className={cn("font-semibold leading-snug", featured ? "text-lg" : "text-base")}>{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
        <p className="text-xs text-primary">
          <span className="font-medium">Why it helps:</span> {why}
        </p>

        <Button asChild variant="outline" size="sm" className="mt-auto w-full gap-1.5 sm:w-fit">
          <a href={href} target="_blank" rel="noopener noreferrer">
            Open resource
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </Button>
      </CardContent>
    </Card>
  )
}
